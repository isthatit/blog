import Joi, { options } from '@hapi/joi';
import User from '../../models/user';
import http from 'https';

export const register = async ctx => {
  const schema = Joi.object().keys({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(20)
      .required(),
    password: Joi.string().required(),
  });
  const result = schema.validate(ctx.request.body);
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
  const { code } = await ctx.query;
  const { K_CLIENT_ID } = process.env;

  console.log(code);

  const data = JSON.stringify({
    grant_type: 'authorization_code',
    client_id: K_CLIENT_ID,
    redirect_uri: 'http://localhost:4000/api/auth/kakao',
    code: code,
  });
  const query = `?grant_type=authorization_code&client_id=${K_CLIENT_ID}&redirect_uri=http://localhost:4000/api/auth/kakao&code=${code}`;

  const options = {
    hostname: 'kauth.kakao.com',
    port: 443,
    path: '/oauth/token' + query,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
    data,
  };
  let serverData = '';

  const result = await http
    .request(options, res => {
      res.on('data', chunk => {
        serverData += chunk;
      });
      res.on('end', () => {
        console.log('received..');
        const { access_token } = JSON.parse(serverData);

        return getUserInfo(access_token);
      });
    })
    .end();

  console.log(result);

  ctx.state = 200;

  return result;
};

const getUserInfo = async access_token => {
  console.log('init?', access_token.length);
  const result = await http
    .request(
      {
        hostname: 'kapi.kakao.com',
        path: '/v2/user/me',
        port: 443,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-type': 'application/x-www-form-urlencoded;charset=utf-8',
        },
      },
      res => {
        console.log('init..');
        let subResult = '';
        res.on('data', chunk => {
          console.log('received..??');
          subResult += chunk;
        });
        res.on('error', e => console.error(e));
        res.on('end', () => {
          return subResult;
        });
      },
    )
    .end();

  return result;
};
