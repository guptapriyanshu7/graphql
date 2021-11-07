import jwt from 'jsonwebtoken';

export default (req, res, next) => {
  try {
    const authHeader = req.get('Authorization');
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, process.env.SECRET);
    req.userId = payload.userId;
    req.isAuth = true;
  } catch (error) {
    req.isAuth = false;
  }
  next();
};
