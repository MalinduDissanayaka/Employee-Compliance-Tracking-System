import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

/**
 * Validates that this field's date value is strictly after the value of
 * another field on the same object (e.g. expiryDate must be after issuedDate).
 */
export function IsAfterDate(property: string, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isAfterDate',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [property],
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints as [string];
          const relatedValue = (args.object as Record<string, unknown>)[
            relatedPropertyName
          ];
          if (!value || !relatedValue) return true;
          const thisDate = new Date(value as string);
          const relatedDate = new Date(relatedValue as string);
          if (isNaN(thisDate.getTime()) || isNaN(relatedDate.getTime())) {
            return true;
          }
          return thisDate.getTime() > relatedDate.getTime();
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints as [string];
          return `${args.property} must be a date after ${relatedPropertyName}`;
        },
      },
    });
  };
}
