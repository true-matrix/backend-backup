// controllers/UserController.js
const jwt = require("jsonwebtoken");
const { ObjectId } = require('mongodb');
const otpGenerator = require("otp-generator");
const mailService = require("../services/mailer");
const otp = require("../Templates/Mail/otp");

const Omega = require('../models/omega');
const filterObj = require("../utils/filterObj");
const catchAsync = require("../utils/catchAsync");

// this function will return you jwt token
const signToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET);

const  extractUserId = (req) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return res.status(401).json({ message: 'User is already logged out!!!' });
  }

  const user = jwt.verify(token, process.env.JWT_SECRET);
  return user.userId;
}


exports.addOmega = catchAsync(async (req, res, next) => {
    try{
    const { email, phone } = req.body;
  
    const filteredBody = filterObj(
      req.body,
      "name",
      "email",
      "password",
      "phone",
      "gender"
    );
  
    // check if a verified user with given email exists
  
    const existing_user = await Omega.findOne({ email: email });
  
    if (existing_user) {
      // user with this email already exists, Please login
      return res.status(400).json({
        status: "error",
        message: "User already exists",
      });
    } else {
      // if user is not created before than create a new one
      const new_user = await Omega.create(filteredBody);
      return res.status(201).json(new_user);
      // generate an otp and send to email
    }}catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
  });

exports.loginOmega = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    const filteredBody = filterObj(
      req.body,
      "email",
      "password",
    );
  
    if (!email || !password) {
      res.status(400).json({
        status: "error",
        message: "Both email and password are required",
      });
      return;
    }
  
    const user = await Omega.findOne({ email: email }).select("+password");
    if (!user || !user.password) {
      res.status(400).json({
        status: "error",
        message: "Incorrect password",
      });
  
      return;
    }
  
    // if (!user || !(await user.correctPassword(password, user.password))) {
    if (!user || user.password !== password) {
      console.log('omega',user);
      res.status(400).json({
        status: "error",
        message: "Email or password is incorrect",
      });
  
      return;
    }
  
    // const token = signToken(user._id);
  
    // res.status(200).json({
    //   status: "success",
    //   message: "Logged in successfully!",
    //   // token,
    //   // user_id: user._id,
    // });
    if (user && (user.password === password)) {
  
      await Omega.findOneAndUpdate({ email: email }, filteredBody, {
        new: true,
        validateModifiedOnly: true,
      });
  
      // generate an otp and send to email
      req.userId = user._id;
      next();
    }
  });

exports.sendOTP = catchAsync(async (req, res, next) => {
    const { userId } = req;
    const new_otp = otpGenerator.generate(4, {
      digits: true,
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
      lowerCaseAlphabets: false, 
      upperCaseAlphabets: false
    });
  
    const otp_expiry_time = Date.now() + 10 * 60 * 1000; // otp validation : 10 Mins after otp is sent
  
    const user = await Omega.findByIdAndUpdate(userId, {
      otp_expiry_time: otp_expiry_time,
    });
  
    user.otp = new_otp.toString();
  
    await user.save({ new: true, validateModifiedOnly: true });
  
    console.log(new_otp);
  
    // TODO send mail
    mailService.sendEmail({
      from: "rajesh.truematrix@gmail.com",
      // to: user.email,
      to: "truematrix@yopmail.com",
      subject: "Verification OTP",
      html: otp(user.name, new_otp),
      attachments: [],
    });
  
    res.status(200).json({
      status: "success",
      message: "OTP Sent Successfully!",
      // email: req?.body?.email,
      email: user.email,
    });
  });

exports.verifyOTP = catchAsync(async (req, res, next) => {
    // verify otp and update user accordingly
    const { email, otp } = req.body;
    const user = await Omega.findOne({
      email,
      otp_expiry_time: { $gt: Date.now() },
    });
  
    if (!user) {
      return res.status(400).json({
        status: "error",
        message: "Email is invalid or OTP expired",
      });
    }
  
    if (user.verified) {
      return res.status(400).json({
        status: "error",
        message: "Email is already verified",
      });
    }
  
    // if (!(await user.correctOTP(otp, user.otp))) {
    if (otp !== user.otp) {

      res.status(400).json({
        status: "error",
        message: "OTP is incorrect",
      });
  
      return;
    }
  
    // OTP is correct
  
    user.verified = true;
    user.otp = undefined;
    await user.save({ new: true, validateModifiedOnly: true });
  
    const token = signToken(user._id);
  
    res.status(200).json({
      status: "success",
      message: "OTP verified Successfully!",
      token,
      user_id: user._id,
    });
  });

exports.logout = catchAsync(async (req, res, next) => {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    if (!token) {
      console.log("token",token)
      return res.status(401).json({ message: 'User is already logged out' });
    }
    try {
      const user = jwt.verify(token, process.env.JWT_SECRET);
  
      // Assuming user.userId is present in the decoded JWT payload
      const userId = user.userId;
  
      // Update the 'verified' field to false in MongoDB
      const updatedUser = await Omega.findByIdAndUpdate(
        userId,
        { $set: { verified: false } },
        { new: true } // Return the updated document
      );
  
      // Continue with the next middleware or route handler
      req.user = updatedUser;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }

    
  
    // res.clearCookie("jwt");
    // res.redirect('/login');
    res.status(200).json({
      status: "success",
      message: "Logout successfully!",
    });
  
  })
exports.getUserById = catchAsync(async (req, res, next) => {
    // const all_users = await User.find({
    //   verified: true,
    // }).select("name _id");
  
    // const this_user = req.user;
  
    // const remaining_users = all_users.filter(
    //   (user) =>
    //     !this_user.friends.includes(user._id) &&
    //     user._id.toString() !== req.user._id.toString()
    // );
    const { userId } = req.params;
    // const userId = extractUserId(req);
    try {
      const user = await Omega.findOne({ _id: userId });
      if (user) {
        res.status(200).json({
          status: 'success',
          data: user,
          message: 'User found successfully!',
        });
      } else {
        res.status(404).json({
          status: 'error',
          message: 'User not found',
        });
      }
    } catch (error) {
      console.error('Error getting user by userId', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  });
exports.getAllVerifiedOmegas = catchAsync(async (req, res, next) => {
  let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    if (!token) {
      return res.status(401).json({ message: 'User is already logged out!!!' });
    }

    let remaining_users;
    try{
    const user = jwt.verify(token, process.env.JWT_SECRET);
      // Assuming user.userId is present in the decoded JWT payload
      const userId = user.userId;
      const all_users = await Omega.find({
      verified: true,
    }).select("name gender _id");
    console.log('all_users',all_users);
    // console.log('req',req);

  
    remaining_users = all_users.filter(
      (user) => user._id.toString() !== userId
    );
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
  
    res.status(200).json({
      status: "success",
      data: remaining_users,
      message: "Users found successfully!",
    });
  });

exports.searchUsers = catchAsync(async (req, res) => {
    const { name } = req.query;
  
    try {
      const users = await Omega.find({ name: new RegExp(name, 'i') });
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });  
  
