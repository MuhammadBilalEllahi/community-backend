const mongoose = require("mongoose");
const TeacherRating = require("../models/rating.model");
const Teacher = require("../models/teacher.model");
const User = require("../models/user.model");
const UserVote = require("../models/voter/vote.model");

const allTeachers = async (req, res) => {
    try {
        const teachers = await Teacher.find().select("name designation imageUrl rating onLeave");

        res.status(200).json({ teachers: teachers });
    } catch (error) {
        res.status(500).json({ error: error });
    }
};

// const rateATeacher = async (req, res) => {
//     const { teacherId, userId, rating } = req.body;



const rateATeacher = async (req, res) => {
    const { teacherId, userId, rating, comment } = req.body;

    if (!teacherId || !userId || rating === undefined) {
        return res.status(400).send("Missing required fields");
    }

    try {

        const teacher = await Teacher.findById(teacherId);
        if (!teacher) {
            return res.status(404).send("Teacher not found");
        }


        let existingRating = await TeacherRating.findOne({ teacherId, userId });

        if (existingRating) {
            existingRating.rating = rating;
            existingRating.comment = comment;
            existingRating.__v += 1;
            await existingRating.save();
        } else {
            existingRating = new TeacherRating({
                teacherId,
                userId,
                rating,
                comment
            });
            await existingRating.save();
            teacher.ratings.push(existingRating._id);
        }
        const teacherIdObj = new mongoose.Types.ObjectId(teacherId);


        const [sumRatings] = await TeacherRating.aggregate([
            { $match: { teacherId: teacherIdObj } },
            { $group: { _id: null, total: { $sum: "$rating" }, count: { $sum: 1 } } }
        ]);

        const averageRating = sumRatings ? (sumRatings.total / sumRatings.count) : 0;
        teacher.rating = averageRating;

        // console.log("This is Teacher rating:", teacher.rating, "and average: ", averageRating, "sum ", sumRatings)

        await teacher.save();

        res.status(200).send("Rating processed successfully");
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ "Server error": err.message });
    }
};


const get_a_TeacherReviews = async (req, res) => {
    const { id } = req.query;

    try {

        const teacher = await Teacher.findById(id).populate({
            path: 'ratings',
            populate: {
                path: 'userId',
                select: '_id name personalEmail universityEmail profilePic universityEmailVerified personalEmailVerified'
            }
        });

        if (!teacher) {
            return res.status(404).json({ message: "Teacher not found" });
        }

        // console.log("theacher:", teacher)




        const populatedRatings = await Promise.all(teacher.ratings.map(async (review) => {
            const userVote = await UserVote.findOne({ reviewId: review._id, userId: review.userId._id });
            // console.log(userVote)
            const userIdData = review.userId ? {
                "_id": review.userId._id,
                "name": review.userId.name,
                "personalEmail": review.userId.personalEmail,
                "universityEmail": review.userId.universityEmail,
                "profilePic": review.userId.profilePic,
                "universityEmailVerified": review.userId.universityEmailVerified,
                "personalEmailVerified": review.userId.personalEmailVerified
            } : null;



            return {
                rating: review.rating,
                comment: review.comment,
                __v: review.__v,
                _id: review._id,
                upvoteCount: review.upvoteCount,
                downvoteCount: review.downvoteCount * (-1),
                updatedAt: review.updatedAt,
                userId: userIdData,
                userVote: userVote ? userVote.voteType : 'none'


            };
        }));

        res.status(200).json(populatedRatings);
    } catch (err) {
        console.error("error", err.message);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};


const getTeacherReviews = async (req, res) => {
    const { id } = req.query;

    try {
        const teacher = await Teacher.findById(id);
        if (!teacher) {
            return res.status(404).json({ message: "Teacher not found" });
        }
        res.status(200).json(teacher);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};



const teacherSpeficicInfo = async (req, res) => {
    const { id } = req.query;
    try {
        const teacher = await Teacher.findById(id);
        if (!teacher) {
            return res.status(404).json({ message: "Teacher not found" });
        }
        // console.log(teacher)
        res.status(200).json(teacher);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
}



const updateReviewVote = async (req, res) => {
    const { reviewId, userId, voteType } = req.body;

    if (!reviewId || !userId || !voteType) {
        return res.status(400).send("Missing required fields");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const review = await TeacherRating.findById(reviewId).session(session);
        if (!review) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).send("Review not found");
        }

        const existingVote = await UserVote.findOne({ reviewId, userId }).session(session);

        if (existingVote) {
            if (existingVote.voteType === voteType) {

                review[voteType === 'upvote' ? 'upvoteCount' : 'downvoteCount']--;
                await UserVote.deleteOne({ _id: existingVote._id }).session(session);
            } else {

                review[existingVote.voteType === 'upvote' ? 'upvoteCount' : 'downvoteCount']--;
                review[voteType === 'upvote' ? 'upvoteCount' : 'downvoteCount']++;
                existingVote.voteType = voteType;
                await existingVote.save();
            }
        } else {

            review[voteType === 'upvote' ? 'upvoteCount' : 'downvoteCount']++;
            await UserVote.create([{ reviewId, userId, voteType }], { session });
        }

        await review.save();
        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            upvoteCount: review.upvoteCount,
            downvoteCount: review.downvoteCount * (-1)

        });
    } catch (error) {
        console.error("Error updating vote:", error);
        await session.abortTransaction();
        res.status(500).json({ error: "Server error" });
    }
};




const deleteReview = async (req, res) => {
    const { teacherId, userId } = req.body;

    if (!teacherId || !userId) {
        return res.status(400).send("Missing required fields");
    }

    try {
        const review = await TeacherRating.findOneAndDelete({ teacherId, userId });

        if (!review) {
            return res.status(404).send("Review not found");
        }

        const teacher = await Teacher.findById(teacherId);
        if (teacher) {
            const reviewRating = review.rating;
            const totalRatings = teacher.ratings.length;


            if (totalRatings > 1) {
                const newRating = ((teacher.rating * totalRatings) - reviewRating) / (totalRatings - 1);
                teacher.ratings = teacher.ratings.filter(rating => !rating.equals(review._id));
                teacher.rating = newRating;
            } else {

                teacher.rating = 0;
                teacher.ratings = [];
            }


            await teacher.save();
        }

        res.status(200).send("Review deleted successfully");
    } catch (error) {
        console.error("Error deleting review:", error);
        res.status(500).json({ error: "Server error" });
    }
}



// const updateReviewVote = async (req, res) => {
//     const { reviewId, userId, voteType } = req.body;

//     if (!reviewId || !userId || !voteType) {
//         return res.status(400).send("Missing required fields");
//     }

//     try {
//         const review = await TeacherRating.findById(reviewId);

//         if (!review) {
//             return res.status(404).send("Review not found");
//         }

//         const isUpvote = voteType === 'upvote';
//         const voteField = isUpvote ? 'upvotes' : 'downvotes';
//         const oppositeVoteField = isUpvote ? 'downvotes' : 'upvotes';


//         review[oppositeVoteField] = review[oppositeVoteField].filter(voter => !voter.equals(userId));


//         if (review[voteField].includes(userId)) {
//             review[voteField] = review[voteField].filter(voter => !voter.equals(userId));
//         } else {
//             review[voteField].push(userId);
//         }

//         await review.save();
//         const review2 = await TeacherRating.findById(reviewId);
//         console.log("rEviw:", review)
//         console.log("rEviw2:", review2)

//         res.status(200).json({ upvotes: review2.upvotes.length, downvotes: review2.downvotes.length * (-1) });
//     } catch (error) {
//         console.error("Error updating vote:", error);
//         res.status(500).json({ error: "Server error" });
//     }
// };




// const deleteReview = async (req, res) => {
//     const { teacherId, userId } = req.body;

//     if (!teacherId || !userId) {
//         return res.status(400).send("Missing required fields");
//     }

//     try {
//         console.log("TeacherID: ", teacherId, "User: ", userId)

//         const review = await TeacherRating.findOne({ teacherId, userId });

//         if (!review) {
//             return res.status(404).send("review not found");
//         }

//         console.log("review which has to be  deleted: ", review)

//         const reviewId = await TeacherRating.findOneAndDelete({ teacherId, userId });

//         console.log("review which is deleted: ", reviewId)

//         const teacher = await Teacher.findById(teacherId);
//         if (teacher) {
//             const rating = teacher.rating;
//             const totalCount = teacher.ratings.length;
//             const newRating = ((rating * totalCount) - reviewId.rating) / (teacher.ratings.length - 1)

//             console.log("new rating:", newRating, "plus,", totalCount, "and: ", rating)
//             teacher.ratings = teacher.ratings.filter(rating => !rating.equals(reviewId._id));
//             teacher.rating = newRating

//             const datq = await teacher.save();
//             console.log("Teachcer: ", datq)
//         }


//         res.status(200).send("Review deleted successfully");
//     } catch (error) {
//         console.error("Error deleting review:", error);
//         res.status(500).json({ error: "Server error" });
//     }
// }



module.exports = {
    allTeachers,
    rateATeacher,
    getTeacherReviews,
    get_a_TeacherReviews,
    teacherSpeficicInfo,
    updateReviewVote,
    deleteReview
};
