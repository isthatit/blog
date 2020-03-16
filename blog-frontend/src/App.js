import React from 'react';
import { Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PostListPage from './pages/PostListPage';
import WritePage from './pages/WritePage';
import PostPage from './pages/PostPage';

import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <>
      <Route component={RegisterPage} path="/register" />
      <Route component={LoginPage} path="/login" />
      <Route component={PostListPage} path={['/@:username', '/']} exact />
      <Route component={PostPage} path="/@:username/:postId" />
      <Route component={WritePage} path="/write" />
    </>
  );
}

export default App;
