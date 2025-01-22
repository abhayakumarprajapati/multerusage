const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const bodyParser = require("body-parser");


app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));


app.use('/images', express.static(path.join(__dirname, 'uploads')));



const connectDB = async () => {

    try {
        await mongoose.connect('mongodb://localhost:27017/testPurpose').then(() => {
            console.log('mongodb connected')
        })
    } catch (error) {
        console.log(error)
    }

}
connectDB()



const userSchema = new mongoose.Schema({
    name: String,
    address: String,
    profile: String
})

const User = mongoose.model("User", userSchema)

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let finalDestinationPath = path.join(__dirname, "uploads");
        // cb(null, '/tmp/my-uploads')
        cb(null, finalDestinationPath)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + "." + file.originalname.split(".").pop())
    }
})

const upload = multer({ storage: storage })


app.post('/newuser', upload.single('profile'), async (req, res, next) => {


    const { name, address } = req.body;

    // Check if required fields are provided
    if (!name || !address || !req.file) {
        return res.status(400).json({ error: 'Name, email, and profile image are required.' });
    }

    const newuser = new User({
        name: name,
        address: address,
        profile: `/images/${req.file.filename}`
    })

    await newuser.save()
    res.status(201).json({
        message: 'User created successfully!',
        user: newuser,
    });

})


app.get('/all', async (req, res, next) => {

    const url = req.protocol + "://" + req.get("host");

    const allusers = await User.find({})

    for (let user of allusers) {
        user.profile = `${url}${user.profile}`
    }

    res.status(201).json({
        message: 'User fetched successfully!',
        allusers,
    });

})


app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        res.status(400).send({ message: 'Multer error occurred.', error: err.message });
    } else if (err) {
        res.status(400).send({ message: 'Unknown error occurred.', error: err.message });
    }
});

app.listen(4000, () => {
    console.log("server is working")
})