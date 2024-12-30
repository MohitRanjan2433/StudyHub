const Section = require("../models/Section");
const Course = require("../models/Course");

exports.Section = async(req,res) => {
    try{
        const {sectionName, courseId} = req.body;

        if(!sectionName || !courseId){
            return res.status(400).json({message: "Please fill in all fields."});
        }

        const newSection = await Section.create({sectionName});

        const updateCourseDetails = await Course.findByIdAndUpdate(
                                        courseId,
                                        {
                                            $push:{
                                                courseContent: newSection._id,
                                            }
                                        },
                                        {new:true},
                                    );
        
            return res.status(200).json({
                success:true,
                message:"Section created Successfully",
                updateCourseDetails,
            }) 
    }catch(error){
        return res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}