const Teacher = require("../models/teacher.model");
const User = require("../models/user.model");

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

//     if (!teacherId || !userId || rating === undefined) {
//         return res.status(400).send('Missing required fields');
//     }

//     try {

//         const teacher = await Teacher.findById(teacherId);

//         if (!teacher) {
//             return res.status(404).send('Teacher not found');
//         }

//         const existingRatingIndex = teacher.ratings.findIndex(r => r.userId.toString() === userId.toString());

//         if (existingRatingIndex !== -1) {

//             teacher.ratings[existingRatingIndex].rating = rating;
//         } else {

//             teacher.ratings.push({ userId, rating });
//         }

//         const totalRatings = teacher.ratings.length;
//         const averageRating = teacher.ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings;
//         teacher.rating = averageRating;

//         await teacher.save();

//         res.status(200).send('Rating added successfully');
//     } catch (err) {
//         res.status(500).send('Server error');
//     }
// }

const rateATeacher = async (req, res) => {
    const { teacherId, userId, rating, comment } = req.body;

    // console.log(teacherId, "this", userId, "this", rating, "this", comment);

    if (!teacherId || !userId || rating === undefined) {
        return res.status(400).send("Missing required fields");
    }

    try {
        const teacher = await Teacher.findById(teacherId);

        if (!teacher) {
            return res.status(404).send("Teacher not found");
        }

        const student = await User.findById({ _id: userId });
        // console.log(student)

        const existingRatingIndex = teacher.ratings.findIndex(
            (r) => r.userId.toString() === student._id.toString()
        );

        // console.log(existingRatingIndex, "isit");
        if (existingRatingIndex !== -1) {
            teacher.ratings[existingRatingIndex].rating = rating;
            teacher.ratings[existingRatingIndex].comment = comment;
            teacher.ratings[existingRatingIndex].__v += 1;
        } else {
            teacher.ratings.push({ userId: student._id, rating, comment });
        }

        const totalRatings = teacher.ratings.length;
        const averageRating =
            teacher.ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings;
        teacher.rating = averageRating;

        await teacher.save();

        res.status(200).send("Rating added successfully");
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ "Server error": err.message });
    }
};

const get_a_TeacherReviews = async (req, res) => {
    const { id } = req.query;

    try {
        const teacher = await Teacher.findById(id).select("ratings rating comment updatedAt __v").populate({
            path: "ratings.userId",
            select: "_id name personalEmail universityEmail profilePic universityEmailVerified personalEmailVerified ",
        });
        if (!teacher) {
            return res.status(404).json({ message: "Teacher not found" });
        }

        const populatedRatings = teacher.ratings.map((review) => {
            const userIdData = review.userId ? {
                "_id": review.userId._id,
                "name": review.userId.name,
                "personalEmail": review.userId.personalEmail,
                "universityEmail": review.userId.universityEmail,
                "profilePic": review.userId.profilePic,
                "universityEmailVerified": review.userId.universityEmailVerified,
                "personalEmailVerified": review.userId.personalEmailVerified,

            } : null;

            return {
                rating: review.rating,
                comment: review.comment,
                __v: review.__v,
                updatedAt: review.updatedAt,
                userId: userIdData
            };
        });

        // console.log(teacher, "and", populatedRatings);

        res.status(200).json(populatedRatings);
    } catch (err) {
        console.log("error", err.message)
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
        res.status(200).json(teacher);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
}






module.exports = {
    allTeachers,
    rateATeacher,
    getTeacherReviews,
    get_a_TeacherReviews,
    teacherSpeficicInfo
};
