import jwt from 'jsonwebtoken';

export default (req, res, next) => {
  console.log("middleware");
  const authHeader = req.get('Authorization');
  if (!authHeader) {
    req.isAuth = false;
    return next();
  }
  try {
    const token = authHeader.split(' ')[1];
    const decodedToken = jwt.verify(token, 'somesupersecretsecret');
    req.userId = decodedToken.userId;
    req.isAuth = true;
    next();
  } catch (error) {
    req.isAuth = false;
    next();
  }
};
