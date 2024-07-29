const Teacher = require("../models/teacher.model")
const User = require("../models/user.model")


const allTeachers = async (req, res) => {
    try {
        const teachers = await Teacher.find()

        res.status(200).json({ "teachers": teachers })
    } catch (error) {
        res.status(500).json({ "error": error })

    }
}

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

    console.log(teacherId, "this", userId, "this", rating, "this", comment)

    if (!teacherId || !userId || rating === undefined) {
        return res.status(400).send('Missing required fields');
    }

    try {
        const teacher = await Teacher.findById(teacherId);

        if (!teacher) {
            return res.status(404).send('Teacher not found');
        }

        const student = await User.findById({ _id: userId })
        // console.log(student)




        const existingRatingIndex = teacher.ratings.findIndex(r => r.userId.toString() === student._id.toString());

        console.log(existingRatingIndex, "isit")
        if (existingRatingIndex !== -1) {
            teacher.ratings[existingRatingIndex].rating = rating;
            teacher.ratings[existingRatingIndex].comment = comment;
        } else {
            teacher.ratings.push({ userId: student._id, rating, comment });
        }

        const totalRatings = teacher.ratings.length;
        const averageRating = teacher.ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings;
        teacher.rating = averageRating;

        await teacher.save();

        res.status(200).send('Rating added successfully');
    } catch (err) {
        console.log(err.message)
        res.status(500).json({ 'Server error': err.message });
    }
};



const getTeacherReviews = async (req, res) => {
    const { id } = req.query

    try {
        const teacher = await Teacher.findById(id);
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        res.status(200).json(teacher);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
}





module.exports = {
    allTeachers,
    rateATeacher,
    getTeacherReviews
}