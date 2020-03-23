import Joi, { options } from 'joi';
import User from '../../models/user';
import axios from 'axios';
import http from 'http';

export const register = async ctx => {
  const schema = Joi.object().keys({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(20)
      .required(),
    password: Joi.string().required(),
  });
  const result = Joi.validate(ctx.request.body, schema);
  if (result.error) {
    ctx.status = 400;
    ctx.body = result.error;
    return;
  }

  const { username, password } = ctx.request.body;
  try {
    const exists = await User.findByUsername(username);
    if (exists) {
      ctx.status = 409; // Conflict
      return;
    }

    const user = new User({
      username,
    });
    await user.setPassword(password);
    await user.save();

    ctx.body = user.serialize();
    const token = user.generateToken();
    ctx.cookies.set('access_token', token, {
      maxAge: 1000 * 60 * 60 * 24 * 7, //7일
      httpOnly: true,
    });
  } catch (e) {
    ctx.throw(500, e);
  }
};
export const login = async ctx => {
  const { username, password } = ctx.request.body;

  if (!username || !password) {
    ctx.status = 401; //Unauthorized
    return;
  }

  try {
    const user = await User.findByUsername(username);
    if (!user) {
      ctx.status = 401;
      return;
    }
    const valid = await user.checkPassword(password);

    if (!valid) {
      ctx.status = 401;
      return;
    }
    ctx.body = user.serialize();
    const token = user.generateToken();
    ctx.cookies.set('access_token', token, {
      maxAge: 604800000, //1000 * 60 * 60 * 24 * 7
      httpOnly: true,
    });
  } catch (e) {
    ctx.throw(500, e);
  }
};
export const check = async ctx => {
  const { user } = ctx.state;
  if (!user) {
    ctx.status = 401;
    return;
  }
  ctx.body = user;
};
export const logout = async ctx => {
  ctx.cookies.set('access_token');
  ctx.status = 204; // No content
};

export const kakao = async ctx => {
  const { code } = ctx.query;
  ctx.status = 200;
  const { K_CLIENT_ID } = process.env;

  console.log(`code: ${code} \n K_CLIENT_ID: ${K_CLIENT_ID}`);
  const data = {
    grant_type: 'authorization_code',
    client_id: K_CLIENT_ID,
    redirect_uri: 'http://localhost:4000/api/auth/kakao',
    code: code,
    headers: {
      'Content-type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
  };
  const result = await axios.post('https://kauth.kakao.com/oauth/token', {
    params: data,
  });

  http.request(options);

  return;
};
