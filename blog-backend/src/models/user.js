import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const UserSchema = new Schema({
  username: String,
  hashedPassword: String,
});
// instance method
UserSchema.methods.setPassword = async function(password) {
  const hash = await bcrypt.hash(password, 10);
  this.hashedPassword = hash;
};

UserSchema.statics.findByUsername = function(username) {
  return this.findOne({ username });
};

UserSchema.methods.checkPassword = async function(password) {
  const result = await bcrypt.compare(password, this.hashedPassword);
  return result;
};

UserSchema.methods.serialize = function() {
  const data = this.toJSON();
  delete data.hashedPassword;
  return data;
};

UserSchema.methods.generateToken = function() {
  const token = jwt.sign(
    // 첫 번째 파라미터는 토큰 안에 넣고 싶은 데이터를 입력
    {
      _id: this.id,
      username: this.username,
    },
    process.env.JWT_SECRET, // JWT 암호 입력
    {
      expiresIn: '7d', // 7일간 유효함
    },
  );
  return token;
};

const User = mongoose.model('User', UserSchema);
export default User;
