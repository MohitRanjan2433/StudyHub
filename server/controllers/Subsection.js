const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
const { uploadImageToCloudinary } = require("../utils/imageUploader");


exports.SubSection = async(req,res) => {
    try{
        const {sectionId, title, timeDuration, description, videoUrl} = req.body;

        const video = req.files.videoFile;

        if(!sectionId || !timeDuration || !title || !description || !video){
            return res.status(400).json({
                success:false,
                message:"All fields are required",
            });
        }

        const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME);

        const subSectionDetails = await SubSection.create({
            title: title,
            timeDuration: timeDuration,
            description: description,
            videoUrl:uploadDetails.secure_url,
        })

        const updateSection = await Section.findByIdAndUpdate({_id: sectionId}, 
                                                        {
                                                            $push:{
                                                                subSection: subSectionDetails._id,
                                                            }
                                                        },
                                                        {new:true}
        );
        return res.status(200).json({
            success:true,
            message:"SubSection created successfully",
            data:updateSection,
        });
    }   
    catch(error){
        return res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}