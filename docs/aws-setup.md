# AWS Setup — EventBridge + SQS

This project uses **EventBridge** to carry compliance lifecycle events
(`COMPLIANCE_EXPIRING_SOON`, `COMPLIANCE_EXPIRED`) and forwards them to an
**SQS** queue that any downstream consumer (email/Slack notifier, audit log,
etc.) can poll. Nothing here is deployed by the app itself — it's created
once, out of band, using the AWS CLI. No account IDs, ARNs, or credentials
are ever hardcoded; every identifier is passed as an environment variable or
substituted from `aws sts get-caller-identity` at setup time.

All resources below stay within the **AWS Free Tier** for low-volume,
demo-scale usage:

- EventBridge: custom event buses are free; `PutEvents` calls are billed per
  million events, well within free-tier-equivalent usage for a compliance
  tracker checking a few hundred records a day.
- SQS: 1,000,000 requests/month are free every month (not just the first 12).

## Prerequisites

- AWS CLI v2 configured with credentials that can manage EventBridge, SQS,
  and IAM (`aws configure`).
- `AWS_REGION` chosen and exported, e.g. `export AWS_REGION=us-east-1`.

## 1. Create a custom EventBridge bus

```bash
aws events create-event-bus --name compliance-tracker-bus --region "$AWS_REGION"
```

Using a custom bus (rather than the account's `default` bus) keeps
compliance events isolated from other application/service events in the
same account.

## 2. Create the SQS queue

```bash
aws sqs create-queue \
  --queue-name compliance-tracker-events \
  --region "$AWS_REGION"

# Note the QueueUrl from the output, then fetch its ARN:
QUEUE_URL=$(aws sqs get-queue-url --queue-name compliance-tracker-events --region "$AWS_REGION" --query QueueUrl --output text)
QUEUE_ARN=$(aws sqs get-queue-attributes --queue-url "$QUEUE_URL" --attribute-names QueueArn --region "$AWS_REGION" --query Attributes.QueueArn --output text)
echo "$QUEUE_ARN"
```

## 3. Allow EventBridge to send messages to the queue

SQS queues need an explicit resource policy granting EventBridge permission
to deliver messages. Save this as `queue-policy.json` (fill in the two
placeholders from your own environment — never hardcode them elsewhere in
the repo):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowEventBridgePublish",
      "Effect": "Allow",
      "Principal": { "Service": "events.amazonaws.com" },
      "Action": "sqs:SendMessage",
      "Resource": "<QUEUE_ARN>",
      "Condition": {
        "ArnEquals": {
          "aws:SourceArn": "arn:aws:events:<AWS_REGION>:<AWS_ACCOUNT_ID>:rule/compliance-tracker-bus/compliance-events-to-sqs"
        }
      }
    }
  ]
}
```

```bash
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
sed -e "s|<QUEUE_ARN>|$QUEUE_ARN|" \
    -e "s|<AWS_REGION>|$AWS_REGION|" \
    -e "s|<AWS_ACCOUNT_ID>|$AWS_ACCOUNT_ID|" \
    queue-policy.json > queue-policy.rendered.json

aws sqs set-queue-attributes \
  --queue-url "$QUEUE_URL" \
  --attributes file://queue-policy.rendered.json \
  --region "$AWS_REGION"
```

(`set-queue-attributes` expects the policy wrapped under a `Policy`
attribute key — adjust the file to `{"Policy": "<json-as-string>"}` or use
`aws sqs set-queue-attributes --attributes Policy="$(cat queue-policy.rendered.json)"`
depending on your shell's quoting.)

## 4. Create the EventBridge rule that forwards to SQS

```bash
aws events put-rule \
  --name compliance-events-to-sqs \
  --event-bus-name compliance-tracker-bus \
  --event-pattern '{"source": ["compliance.tracker"], "detail-type": ["COMPLIANCE_EXPIRING_SOON", "COMPLIANCE_EXPIRED"]}' \
  --region "$AWS_REGION"

aws events put-targets \
  --rule compliance-events-to-sqs \
  --event-bus-name compliance-tracker-bus \
  --targets "Id"="1","Arn"="$QUEUE_ARN" \
  --region "$AWS_REGION"
```

## 5. IAM permissions for the scheduler

The Python scheduler only needs `events:PutEvents` on the custom bus. If
running the scheduler under an IAM user/role, attach a policy such as:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "events:PutEvents",
      "Resource": "arn:aws:events:<AWS_REGION>:<AWS_ACCOUNT_ID>:event-bus/compliance-tracker-bus"
    }
  ]
}
```

boto3 picks up credentials from the environment, `~/.aws/credentials`, or
(if deployed as a Lambda / EC2 instance) the execution/instance role — never
from hardcoded values in this repo.

## 6. Scheduling the checker itself

`scheduler/expiry_checker.py` exposes both a `main()` CLI entry point and a
`lambda_handler(event, context)`. Two supported ways to run it on a
schedule, no Docker required:

- **Local/EC2 cron** — run `python expiry_checker.py` from cron
  (e.g. `0 6 * * * cd /path/to/scheduler && python expiry_checker.py`).
- **EventBridge Scheduler → Lambda** — zip `scheduler/` (with dependencies
  installed into the package directory) and deploy as a Lambda function,
  then create an EventBridge Scheduler rule targeting it:

  ```bash
  aws scheduler create-schedule \
    --name compliance-expiry-check \
    --schedule-expression "rate(1 day)" \
    --flexible-time-window '{"Mode": "OFF"}' \
    --target '{"Arn": "<LAMBDA_FUNCTION_ARN>", "RoleArn": "<SCHEDULER_INVOCATION_ROLE_ARN>"}' \
    --region "$AWS_REGION"
  ```

Either way, the same idempotent script runs — see the root README's
"Idempotency Strategy" section for why re-running it safely no-ops on
unchanged data.

## Teardown

```bash
aws events remove-targets --rule compliance-events-to-sqs --event-bus-name compliance-tracker-bus --ids 1 --region "$AWS_REGION"
aws events delete-rule --name compliance-events-to-sqs --event-bus-name compliance-tracker-bus --region "$AWS_REGION"
aws events delete-event-bus --name compliance-tracker-bus --region "$AWS_REGION"
aws sqs delete-queue --queue-url "$QUEUE_URL" --region "$AWS_REGION"
```

---

## Windows / PowerShell quick start

Equivalent of steps 1–4 above, written for `aws.exe` in PowerShell (no jq,
no bash string interpolation) — install the AWS CLI first via
`winget install --id Amazon.AWSCLI -e`, then `aws configure`.

```powershell
$Region = "us-east-1"   # your region

# 1. Custom bus
aws events create-event-bus --name compliance-tracker-bus --region $Region

# 2. SQS queue
aws sqs create-queue --queue-name compliance-tracker-events --region $Region
$QueueUrl = aws sqs get-queue-url --queue-name compliance-tracker-events --region $Region --query QueueUrl --output text
$QueueArn = aws sqs get-queue-attributes --queue-url $QueueUrl --attribute-names QueueArn --region $Region --query Attributes.QueueArn --output text

# 3. Rule matching our two event types
aws events put-rule `
  --name compliance-events-to-sqs `
  --event-bus-name compliance-tracker-bus `
  --event-pattern '{"source": ["compliance.tracker"], "detail-type": ["COMPLIANCE_EXPIRING_SOON", "COMPLIANCE_EXPIRED"]}' `
  --region $Region

# 4. Target the queue
aws events put-targets `
  --rule compliance-events-to-sqs `
  --event-bus-name compliance-tracker-bus `
  --targets "Id=1,Arn=$QueueArn" `
  --region $Region

# 5. Queue policy allowing EventBridge to deliver
$AccountId = aws sts get-caller-identity --query Account --output text
$RuleArn = "arn:aws:events:${Region}:${AccountId}:rule/compliance-tracker-bus/compliance-events-to-sqs"

$Policy = @{
  Version = "2012-10-17"
  Statement = @(
    @{
      Sid       = "AllowEventBridgePublish"
      Effect    = "Allow"
      Principal = @{ Service = "events.amazonaws.com" }
      Action    = "sqs:SendMessage"
      Resource  = $QueueArn
      Condition = @{ ArnEquals = @{ "aws:SourceArn" = $RuleArn } }
    }
  )
}
$Attributes = @{ Policy = ($Policy | ConvertTo-Json -Depth 10 -Compress) } | ConvertTo-Json -Depth 10 -Compress
$Attributes | Out-File -Encoding utf8 "$env:TEMP\sqs-attrs.json"
aws sqs set-queue-attributes --queue-url $QueueUrl --attributes "file://$env:TEMP\sqs-attrs.json" --region $Region

# 6. Let the IAM user running the scheduler publish events (replace "yourname")
$EventsPolicy = @{
  Version = "2012-10-17"
  Statement = @(
    @{
      Effect   = "Allow"
      Action   = "events:PutEvents"
      Resource = "arn:aws:events:${Region}:${AccountId}:event-bus/compliance-tracker-bus"
    }
  )
} | ConvertTo-Json -Depth 10 -Compress
$EventsPolicy | Out-File -Encoding utf8 "$env:TEMP\events-policy.json"
aws iam put-user-policy `
  --user-name yourname `
  --policy-name ComplianceTrackerEventBridgePublish `
  --policy-document "file://$env:TEMP\events-policy.json"
```

Then set `AWS_REGION` and `EVENT_BUS_NAME=compliance-tracker-bus` in
`scheduler\.env`, run `python expiry_checker.py`, and check delivery with:

```powershell
aws sqs receive-message --queue-url $QueueUrl --region $Region
```
