const multer = require('multer');
const path = require("path");
const File = require("../models/file");
const Image = require("../models/image");
const catchAsync = require("../utils/catchAsync");
// Multer configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
      // return cb(null,`${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
    },
  });
  
  const upload = multer({ storage: storage });

// File upload controller
// exports.fileUpload = catchAsync(async (req, res, next) => {
//     try {
//       // Use the 'upload' middleware to handle the file
//       upload.single('profilePicture')(req, res, async (err) => {
//         if (err) {
//           console.error(err);
//           return res.status(500).json({
//             status: 'error',
//             message: 'File upload failed',
//           });
//         }
  
//         // Create a new file record in the database
//         const newFile = new File({
//           filename: req.file.filename,
//           originalname: req.file.originalname,
//           path: req.file.path,
//         });
  
//         // Save the file record to the database
//         await newFile.save();
  
//         res.status(200).json({
//           // data: newFile,
//           // image_url: `http://localhost:3001/uploads/${req.file.filename}`,
//           image_url: `https://backend-api-0pbl.onrender.com/uploads/${req.file.filename}`,
//           status: 'success',
//           message: 'File uploaded successfully',
//         });
//       });
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({
//         status: 'error',
//         message: 'Internal server error',
//       });
//     }
//   });

exports.fileUpload = upload.single('profilePicture'), catchAsync(async (req, res, next) => {
  try {
    // Check if a file was uploaded
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded',
      });
    }

    // Create a new file record in the database
    const newFile = new File({
      filename: req.file.filename,
      originalname: req.file.originalname,
      path: req.file.path,
    });

    // Save the file record to the database
    await newFile.save();

    res.status(200).json({
      image_url: `https://68.178.173.95:3001/uploads/${req.file.filename}`,
      status: 'success',
      message: 'File uploaded successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
});

exports.getImage = catchAsync(async (req, res, next) => {
    const imageId = req.params.imageId; // Assuming you pass the imageId as a parameter in the route
  
    // Retrieve the image from MongoDB
    const image = await Image.findById(imageId);
  
    if (!image) {
      return res.status(404).json({ status: 'error', message: 'Image not found' });
    }
  
    // Set appropriate headers for the image
    // res.setHeader('Content-Type', 'image/jpeg'); // Adjust the content type based on your image type
    // res.setHeader('Content-Length', image.length);
  
    // Send the image binary data to the client
    res.send(image);
  });  
  