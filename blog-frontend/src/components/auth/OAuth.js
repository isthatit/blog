import React from 'react';

const OAuth = ({ name }) => {
  var win = window.open(
    'https://kauth.kakao.com/oauth/authorize?client_id=b52dfd612c258eb2c37cfbfe4b011fef&redirect_uri=http://localhost:4000/api/auth/kakao&response_type=code',
    '카카오 로그인',
    'width=320, height=480, toolbar=no, location=no',
  );
  win.opener = 'self';
  return <>{win}</>;
};

export default OAuth;
