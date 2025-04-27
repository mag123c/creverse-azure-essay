import { registerDecorator, type ValidationOptions, type ValidationArguments } from 'class-validator';

export function IsValidSortField(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidSortField',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, _args: ValidationArguments) {
          if (typeof value !== 'string') return false;

          const [field, direction] = value.split(',');

          const allowedFields = ['createdDt'];
          const allowedDirections = ['ASC', 'DESC'];

          if (!field || !direction) return false;
          if (!allowedFields.includes(field)) return false;
          if (!allowedDirections.includes(direction.toUpperCase())) return false;

          return true;
        },
        defaultMessage(_args: ValidationArguments) {
          return 'sort는 "xxxx,ASC" 또는 "xxxx,DESC" 형식이어야 합니다.';
        },
      },
    });
  };
}
