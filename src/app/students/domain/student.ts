export class Student {
  constructor(
    readonly id: number,
    readonly name: string,
  ) {}

  static ofDecodedToken(user: { id: number; name: string }): Student {
    return new Student(user.id, user.name);
  }
}
