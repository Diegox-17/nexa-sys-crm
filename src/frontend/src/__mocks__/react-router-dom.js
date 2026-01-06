import React from 'react';

const actualReactRouterDom = jest.requireActual('react-router-dom');

export const useNavigate = jest.fn(() => jest.fn());
export const useParams = jest.fn(() => ({ id: '1' }));
export const Link = ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>;
export const BrowserRouter = ({ children }) => <div>{children}</div>;

export default {
  ...actualReactRouterDom,
  useNavigate,
  useParams,
  Link,
  BrowserRouter,
};
