import express from 'express';
import { PrismaClient } from '@prisma/client';

import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
// import dotenv from 'dotenv';

// dotenv.config()


const app = express();
const prisma = new PrismaClient();
const {JWT_SECRET} = process.env;
import auth from './middlewares/auth.js';


app.use(express.json());
app.use(cookieParser())   // middleware for cookie object, otherwise the object is too long / big




// Create a new product
app.post('/products', async (req, res) => {

    const { name, description, price } = req.body;
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
      },
    });

    res.status(201).json(product);
  });
  


  // Get all products
  app.get('/products', async (req, res) => {

    const products = await prisma.product.findMany();
    res.json(products);
  });
  


  // Get a single product by ID
  app.get('/products/:id', async (req, res) => {

    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
    });

    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  });
  


  // Update a product by ID
  app.put('/products/:id', async (req, res) => {

    const { id } = req.params;
    const { name, description, price } = req.body;
    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        price,
      },
    });
    res.json(product);
  });
  


  // Delete a product by ID
  app.delete('/products/:id', async (req, res) => {

    const { id } = req.params;
    await prisma.product.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).end();
  });
  


// REST API FOR USER


// Create a new user
app.post('/users', async (req, res) => {
    const { name, email } = req.body;
    try {
      const user = await prisma.user.create({
        data: {
          name,
          email,
        },
      });
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: 'User with this email already exists' });
    }
  });
  
  // Get all users
  app.get('/users', async (req, res) => {
    const users = await prisma.user.findMany();
    res.json(users);
  });
  
  // Get a single user by ID
  app.get('/users/:id', async (req, res) => {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  });
  
  // Update a user by ID
  app.put('/users/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email } = req.body;
    try {
      const user = await prisma.user.update({
        where: { id: parseInt(id) },
        data: {
          name,
          email,
        },
      });
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: 'Error updating user' });
    }
  });
  
  // Delete a user by ID
  app.delete('/users/:id', async (req, res) => {
    const { id } = req.params;
    await prisma.user.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).end();
  });
  



// REGISTER AND LOGIN A USER WITH JWT TOKEN

app.post("/register", async (req,res)=> {

    try{
          //get all data from body
          const {name, email, password, age} = req.body;

          // all the data should exists
          if( !(name && email && password && age))
          {
            
              return res.status(400).json({result: 'all fields are compulsory'})
          }

          const existingUser = await prisma.user.findUnique({
            where: {
              email: email,
            }
          });

          if(existingUser)
          {
            return res.status(401).json({result: 'user already exist'});
          }
          // check param
          // encrypt the password
          const myEncPassword = await bcrypt.hash(password,5);

          const user = await prisma.user.create({
              data:{
                name,
                email,
                password: myEncPassword,
                age
              }
          })
          // save the user in db
          // generate a token for user and send it
           const token =  jwt.sign(
              
            {id:user.id, email},
            JWT_SECRET, // process.env.jwtsecret
            {
              expiresIn: "2h" 
            }
           )

           // if you want to store token in db , then this process


      //   const updatedUser = await prisma.user.update({
      //     where: { id: user.id },
      //     data: { token }
      // });

      // updatedUser.password = undefined;

      // res.status(201).json(updatedUser);



      // if you dont want to store token in db

           // setting the properties of newly created user object, bcz we dont want to show on the frontend.
           // this way, the property value does not change in the database. only it changes
           user.token = token;
           user.password = undefined;

           res.status(201).json(user);


        } catch (error) {
          console.log(error);
          res.status(500).json('Internal Server Error');
        }
        
})







app.post('/login', async(req,res)=>{

  try{

      const {email,password} = req.body;

      // validation

      if(!(email && password))
      {
        res.status(400).json({result: "plz provide credentials"});
      }

      const authUser = await prisma.user.findUnique({where: {email}});
      
      // console.log(authUser);

      if(authUser)
      {        
        if( await bcrypt.compare(password, authUser.password))
        {

          const token = jwt.sign(
            {id: authUser.id, email},
            JWT_SECRET, // process.env.JWT_SECRET
            {
              expiresIn: "4h"
            }
          );

          authUser.token = token;
          authUser.password = undefined
          
          //send token in user cookie
          const options = {
            expires: new Date(Date.now() + 3 * 24 * 60 * 1000),
            httpOnly: true
          }

          res.status(200).cookie("token", token, options).json({
            success: true,
            token,
            authUser
          })


        } else {
          res.status(200).json('wrong password');
        }

      } else {
          res.status(400).json('user not exist.');
      }

      

  } catch(error)
  {
    console.log(error);
  }
})



app.get('/dashboard', auth, (req,res)=>{


  return res.send('welcome to dashboard');
})





  // Start the server
  app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
  });
