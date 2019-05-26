import { AuthorizationError } from './errors/index';
import { UserType, UserModel } from './../models/user';
import * as bcrypt from 'bcryptjs';
import { Schema } from 'mongoose';
import { ValidationError, LogicError } from './errors';
import { isMongoId, isEmpty, isEmail } from 'validator';

function leanUser(user: UserType): UserType {
  return {
    id: user._id,
    name: user.name,
    surname: user.surname,
    email: user.email,
    role: user.role,
  };
}

export default {
  async create(name: string, surname: string, email: string, password: string) {
    if (password.trim() === '') throw new ValidationError('password is required');

    const _users = await UserModel.find({ email });
    if (_users.length) throw new ValidationError('email already registered');

    const hashPassword = await bcrypt.hash(password, 12);
    try {
      const user = await UserModel.create({ name, surname, email, password: hashPassword });
      return leanUser(user);
    } catch (err) {
      const { errors } = err;
      const keys = Object.keys(err.errors);
      const { name, path, kind, message } = errors[keys[0]];
      if (name === 'ValidatorError') {
        if (kind === 'required') throw new ValidationError(`${path} is required`);
        else throw new ValidationError(message);
      }
      throw err;
    }
  },

  async login(email: string, password: string) {
    if (isEmpty(email)) throw new ValidationError('email is required');
    if (!isEmail(email)) throw new ValidationError('email not contains a valid email');
    if (isEmpty(password)) throw new ValidationError('password is required');

    const user = await UserModel.findOne({ email });
    if (!user) throw new AuthorizationError('wrong credentials');
    if (await !bcrypt.compare(password, user.password)) {
      throw new AuthorizationError('wrong credentials');
    }
    return { id: user.id.toString(), role: user.role };
  },

  async retrieve(id: string | Schema.Types.ObjectId) {
    if (typeof id === 'string' && !isMongoId(id)) throw new ValidationError('id is not correct');
    const user = await UserModel.findById(id);
    if (!user) throw new LogicError('id not found');
    return leanUser(user);
  },

  async retrieveAll() {
    const users = await UserModel.find();
    return users.map(user => leanUser(user));
  },
};
