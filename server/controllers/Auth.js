const User = require("../models/User")
const OTP = require("../models/OTP")
const Profile = require("../models/Profile")
const otpGenerator = require("otp-generator")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken");
require("dotenv").config();


exports.sendOTP = async(req, res) => {

    try{
        const {email} = req.body;

        const checkUserPresent = await User.findOne({email});
        if(checkUserPresent){
            return res.status(401).json({
                success: false,
                message: "User already exists",
            })
        }

        //generate OTP
        var otp = otpGenerator.generate(6,{
            upperCaseAlphabets:false,
            lowerCaseAlphabets:false,
            specialChars:false
        });
        console.log("Otp generated: ", otp)

        let result = OTP.findOne({otp: otp});

        while(result){
            otp = otpGenerator(6,{
                upperCaseAlphabets:false,
                lowerCaseAlphabets:false,
                specialChars:false,
            });
            result = OTP.findOne({otp: otp});
        }

        const otpPayload = {email, otp};

        const otpBody = await OTP.create(otpPayload)
        console.log(otpBody);

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully",
            otp: otp
        })
    }catch(error){
        console.log(error)
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        })
    }
};


//signup
exports.signup = async(req, res) => {
    try{

        const {
            firstName,
            lastName, 
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber, 
            otp
        } = req.body;

        if(!firstName || !lastName || !email || !password || !confirmPassword || !otp){
            return res.status(400).json({
                success: false,
                message: "Please fill all the fields",
            });
        }

        //pass-match

        if(password !== confirmPassword){
            return res.status(400).json({
                success: false,
                message: "Password and confirmPassword do not match",
            });
        }

        const existingUser = await User.findOne({eamil});
        if(existingUser){
            return res.status(400).json({
                success: false,
                message: "User already exists",
            });
        }

        const recentOtp = (await OTP.find({email})).sort({createdAt:-1}).limit(1);
        console.log(recentOtp)

        if(recentOtp.length == 0){
            return res.status(400).json({
                success: false,
                message: "OTP not found",
            })
        }else if(otp !== recentOtp){
            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
            });
        }

        const hashedPassword = await bcrypt.hash(password ,10);

        const profile = await Profile.create({
            gender:null,
            dateOfBirth: null,
            about:null,
            contactNumer:null,
        });

        const userDetails = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            contactNumber,
            accountType,
            additionDetails: profile._id,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstname} ${lastName}`,
        });

        return res.status(200).json({
            success: true,
            message: "User created successfully",
            user,
        });
    }
    catch(error){
        console.log(error)
        return res.status(500).json({
            success:false,
            message:"User cannot be registrered. Please try again",
        })
    }
}


exports.login = async(req, res) => {
    try{
        const {email, password} = req.body;

        if(!email || !password){
            return res.status(403).json({
                success: false,
                message: "Please enter both email and password",
            });
        }

        const user = await User.findOne({email});
        if(!user){
            return res.status(401).json({
                success: false,
                message: "User not found",
            })
        }

        if(await bcrypt.compare(password, user.password)){

            const payload = {
                email: user.email,
                id: user._id,
                accountType: user.accountType,
            }
            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn: '1h',
            });

            user.token = token,
            user.password = undefined;

            const options = {
                expires: new Date(Date.now() + 3*24*60*60*1000),
                httpOnly:true,
            }

            res.cookie("token", token, options).status(200).json({
                success: true,
                message: "User logged in successfully",
                user: user,
                token,
            })
        }
        else {
            return res.status(401).json({
                success:false,
                message:'Password is incorrect',
            });
        }
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:'Login Failure, please try again',
        });
    }
}