import jwt from 'jsonwebtoken';
import {JWT_SECRET} from 'process.ev'



export async function auth (req, res, next)
{
    
  console.log(req.cookies);
  const {token} = req.cookies;
  
  if(!token)
  {
    res.status(403).send('please login first');
    // res.status(403).json({error: 'please login first'});
  }

  try{
    const decode = jwt.verify(token, JWT_SECRET);
    console.log(decode);
    req.user = decode;

  } catch(error)
  {
    console.log(error);

  }

  return next();

}


export default auth;