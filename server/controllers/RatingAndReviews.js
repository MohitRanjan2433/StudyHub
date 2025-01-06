const RatingAndReviews = require("../models/RatingAndRaview")
const Course = require("../models/Course")



exports.createRating = async(req, res) => {
    try{

        const userId = req.user.id;

        const {rating, review, courseId} = req.body;

        const courseDetail = await Course.findOne(
                                            {_id: courseId, 
                                                studentsEnrolled: {$elemMatch: {$eq: userId} },
                                            }
        );

        if(!courseDetail){
            return res.status(404).json({
                status:false,
                message: "Student is not enrolled in this course",
            });
        }

        const alreadyReview = await RatingAndReviews.findOne({
                                            user: userId,
                                            course: courseId,
        });

        if(alreadyReview){
            return res.status(403).json({
                status:false,
                message: "You have already reviewed this course",
            });
        }

        const ratingAndReviews = await RatingAndReviews.create({
            rating,
            review,
            course:courseId,
            user: userId,
        });

        const updatedCourseDetail = await Course.findByIdAndUpdate(courseId, 
                    {
                        $push: {
                            ratingAndReviews: ratingAndReviews._id,
                        }
                    },
                    {new: true});

        console.log(updatedCourseDetail);

        return res.status(200).json({
            status:true,
            message: "Rating and review added successfully",
            ratingAndReviews,
        });
        
    }catch(error){
        console.log(error);
        return res.status(500).json({
            status:false,
            message: error.message,
        });
    }
}


exports.generateAverageRating = async(req,res) => {
    try{
        const courseId = req.body.courseId

        const result = await RatingAndReviews.aggregate([
            {
                $match:{
                    course: new mongoose.Types.ObjectId(courseId),

                },
            },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: "$rating"},
                },
            }
        ])

        if(result.length > 0){
            return res.status(200).json({
                status:true,
                averageRating: result[0].averageRating,
            })
        }

        return res.status(200).json({
            status:true,
            message:"No ratings found",
            averageRating: 0,
        });

    }catch(error){
        console.log(error);
        return res.status(500).json({
            status:false,
            message: error.message,
        })
    }
}

exports.getAllRating = async(req,res) => {
    try{
        const { courseId } = req.body;

        const allRatings = await RatingAndReviews.find({course: courseId})
                                                .sort({rating: "desc"})
                                                .populate({
                                                    path: "user",
                                                    select: "firstName lastName eamil image",
                                                })
                                                .populate({
                                                    path: "course",
                                                    select: "courseName",
                                                })
                                                .exec();
                                                
        if(allRatings.length === 0){
            return res.status(200).json({
                status: true,
                message: "No ratings found",
                ratings: [],
            });
        }

        return res.status(200).json({
            status: true,
            ratings: allRatings,
        });

    }catch(error){
        console.log(error);
        return res.status(500).json({
            status:false,
            message: error.message,
        })
    }
}