const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const mailService = require("../services/mailer");
const crypto = require("crypto");
const filterObj = require("../utils/filterObj");

// Model
const User = require("../models/user");
const otp = require("../Templates/Mail/otp");
const resetPassword = require("../Templates/Mail/resetPassword");
const { promisify } = require("util");
const catchAsync = require("../utils/catchAsync");

// this function will return you jwt token
const signToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET);


// exports.logout = catchAsync(async (req, res, next) => {
//   let token;
//   if (
//     req.headers.authorization &&
//     req.headers.authorization.startsWith("Bearer")
//   ) {
//     token = req.headers.authorization.split(" ")[1];
//   } else if (req.cookies.jwt) {
//     token = req.cookies.jwt;
//   }
//   if (!token) {
//     console.log("token",token)
//     return res.status(401).json({ message: 'User is already logged out' });
//   }
//   const verifyUser = jwt.verify(token, process.env.JWT_SECRET)

//   // console.log("verifyUser=>",verifyUser)

//   // const existing_user = await User.findOne({ _id: verifyUser.userId });
//   // req.user = existing_user;
//   // console.log("existing_user",existing_user)

//   jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//     if (err) {
//       console.log("err",err)
//       return res.status(403).json({ message: 'Invalid token' });
//     }
//     console.log("user",user)
//     req.user = user;
//     next();
//   });

//   // res.clearCookie("jwt");
//   // res.redirect('/login');
  
//   res.status(200).json({
//     status: "success",
//     message: "Logout successfully!",
//   });

// })

// Register New User

// exports.register = catchAsync(async (req, res, next) => {
//   const { firstName, lastName, email, password } = req.body;

//   const filteredBody = filterObj(
//     req.body,
//     "firstName",
//     "lastName",
//     "email",
//     "password"
//   );

//   // check if a verified user with given email exists

//   const existing_user = await User.findOne({ email: email });

//   if (existing_user && existing_user.verified) {
//     // user with this email already exists, Please login
//     return res.status(400).json({
//       status: "error",
//       message: "Email already in use, Please login.",
//     });
//   } else if (existing_user) {
//     // if not verified than update prev one

//     await User.findOneAndUpdate({ email: email }, filteredBody, {
//       new: true,
//       validateModifiedOnly: true,
//     });

//     // generate an otp and send to email
//     req.userId = existing_user._id;
//     next();
//   } else {
//     // if user is not created before than create a new one
//     const new_user = await User.create(filteredBody);

//     // generate an otp and send to email
//     req.userId = new_user._id;
//     next();
//   }
// });

// exports.sendOTP = catchAsync(async (req, res, next) => {
//   const { userId } = req;
//   const new_otp = otpGenerator.generate(4, {
//     digits: true,
//     upperCaseAlphabets: false,
//     specialChars: false,
//     lowerCaseAlphabets: false,
//     lowerCaseAlphabets: false, 
//     upperCaseAlphabets: false
//   });

//   const otp_expiry_time = Date.now() + 10 * 60 * 1000; // otp validation : 10 Mins after otp is sent

//   const user = await User.findByIdAndUpdate(userId, {
//     otp_expiry_time: otp_expiry_time,
//   });

//   user.otp = new_otp.toString();

//   await user.save({ new: true, validateModifiedOnly: true });

//   console.log(new_otp);

//   // TODO send mail
//   mailService.sendEmail({
//     from: "rajesh.truematrix@gmail.com",
//     to: user.email,
//     subject: "Verification OTP",
//     html: otp(user.firstName, new_otp),
//     attachments: [],
//   });

//   res.status(200).json({
//     status: "success",
//     message: "OTP Sent Successfully!",
//     // email: req?.body?.email,
//     email: user.email,
//   });
// });
// exports.verifyOTP = catchAsync(async (req, res, next) => {
//   // verify otp and update user accordingly
//   const { email, otp } = req.body;
//   const user = await User.findOne({
//     email,
//     otp_expiry_time: { $gt: Date.now() },
//   });

//   if (!user) {
//     return res.status(400).json({
//       status: "error",
//       message: "Email is invalid or OTP expired",
//     });
//   }

//   if (user.verified) {
//     return res.status(400).json({
//       status: "error",
//       message: "Email is already verified",
//     });
//   }

//   if (!(await user.correctOTP(otp, user.otp))) {
//     res.status(400).json({
//       status: "error",
//       message: "OTP is incorrect",
//     });

//     return;
//   }

//   // OTP is correct

//   user.verified = true;
//   user.otp = undefined;
//   await user.save({ new: true, validateModifiedOnly: true });

//   const token = signToken(user._id);

//   res.status(200).json({
//     status: "success",
//     message: "OTP verified Successfully!",
//     token,
//     user_id: user._id,
//   });
// });

// User Login
// exports.login = catchAsync(async (req, res, next) => {
//   const { email, password } = req.body;

//   if (!email  !password) {
//     res.status(400).json({
//       status: "error",
//       message: "Both email and password are required",
//     });
//     return;
//   }

//   const user = await User.findOne({ email: email }).select("+password");
//   if (!user  !user.password) {
//     res.status(400).json({
//       status: "error",
//       message: "Incorrect password",
//     });

//     return;
//   }

//   if (!user  !(await user.correctPassword(password, user.password))) {
//   // if (!user  user.password !== password) {
//     console.log('user',user);
//     res.status(400).json({
//       status: "error",
//       message: "Email or password is incorrect",
//     });

//     return;
//   }

//   const token = signToken(user._id);

//   res.status(200).json({
//     status: "success",
//     message: "Logged in successfully!",
//     token,
//     user_id: user._id,
//   });
// });

exports.addUser = catchAsync(async (req, res, next) => {
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

  const existing_user = await User.findOne({ email: email });

  if (existing_user) {
    // user with this email already exists, Please login
    return res.status(400).json({
      status: "error",
      message: "User already exists",
    });
  } else {
    // if user is not created before than create a new one
    const new_user = await User.create(filteredBody);
    return res.status(201).json({
      status: 'success',
      data: new_user,
      message: 'User added successfully',
    });
    // generate an otp and send to email
  }}catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // const filteredBody = filterObj(
  //   req.body,
  //   "email",
  //   "password",
  // );

  if (!email || !password) {
    res.status(400).json({
      status: "error",
      message: "Both email and password are required",
    });
    return;
  }

  const user = await User.findOne({ email: email }).select("+password");
  if (!user || !user.password) {
    res.status(400).json({
      status: "error",
      message: "Incorrect password",
    });

    return;
  }

  if (!user ||  !(await user.correctPassword(password, user.password))) {
  // if (!user  user.password !== password) {
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
  if (user || (await user.correctPassword(password, user.password))) {
  // if (user && (user.password === password)) {

    // await User.findOneAndUpdate({ email: email }, filteredBody, {
    //   new: true,
    //   validateModifiedOnly: true,
    // });

    // generate an otp and send to email
    req.userId = user._id;
    next();
  }

  // const token = signToken(user._id);

  // res.status(200).json({
  //   status: "success",
  //   message: "Logged in successfully!",
  //   token,
  //   user_id: user._id,
  // });
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

  const user = await User.findByIdAndUpdate(userId, {
    otp_expiry_time: otp_expiry_time,
    otp_send_time: new Date(),
    otp : new_otp.toString()
  });

  // user.otp = new_otp.toString();

  await user.save({ new: true, validateModifiedOnly: true });

  console.log("new_otp",new_otp);

  // TODO send mail
  mailService.sendEmail({
    from: "packwolf2024@gmail.com",
    // to: user.email,
    // to: "truematrix@yopmail.com",
    to: "otp@truematrix.ai",
    subject: "Verification OTP",
    html: otp(user.name, new_otp),
    attachments: [],
  });

  res.status(200).json({
    status: "success",
    message: "OTP Sent Successfully!",
    // email: req?.body?.email,
    email: user.email,
    otp_send_time: user.otp_send_time,
  });
});

exports.verifyOTP = catchAsync(async (req, res, next) => {
  // verify otp and update user accordingly
  const { email, otp } = req.body;
  const user = await User.findOne({
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

// exports.getOtpTime = catchAsync(async (req,res,next) =>{

// })

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
    const updatedUser = await User.findByIdAndUpdate(
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
// Protect
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there
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
    return res.status(401).json({
      message: "You are not logged in! Please log in to get access.",
    });
  }
  // 2) Verification of token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // console.log("decoded",decoded);

  // 3) Check if user still exists

  const this_user = await User.findById(decoded.userId);
  if (!this_user) {
    return res.status(401).json({
      message: "The user belonging to this token does no longer exists.",
    });
  }
  // 4) Check if user changed password after the token was issued
  if (this_user.changedPasswordAfter(decoded.iat)) {
    return res.status(401).json({
      message: "User recently changed password! Please log in again.",
    });
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = this_user;
  next();
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(404).json({
      status: "error",
      message: "There is no user with email address.",
    });
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  try {
    // const resetURL = `http://localhost:3000/auth/new-password?token=${resetToken}`;
    const resetURL = `https://wolf.blutrain.net/auth/new-password?token=${resetToken}`;
    // TODO => Send Email with this Reset URL to user's email address

    console.log(resetURL);

    mailService.sendEmail({
      // from: "rajesh.truematrix@gmail.com",
      from: "packwolf2024@gmail.com",
      to: user.email,
      subject: "Reset Password",
      html: resetPassword(user.firstName, resetURL),
      attachments: [],
    });

    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(500).json({
      message: "There was an error sending the email. Try again later!",
    });
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.body.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return res.status(400).json({
      status: "error",
      message: "Token is Invalid or Expired",
    });
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT
  const token = signToken(user._id);

  res.status(200).json({
    status: "success",
    message: "Password Reseted Successfully",
    token,
  });
});
