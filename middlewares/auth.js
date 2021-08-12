import jwt from 'jsonwebtoken';

export default (req, res, next) => {
  const authHeader = req.get('Authorization');
  if (!authHeader) {
    req.isAuth = false;
    return next();
  }
  try {
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, 'somesupersecretsecret');
    req.userId = payload.userId;
    req.isAuth = true;
    next();
  } catch (error) {
    req.isAuth = false;
    next();
  }
};
