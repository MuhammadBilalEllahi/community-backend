const resendProt = require("resend");
const { Resend } = resendProt;
const resend = new Resend(process.env.resend);

const resendEmail = async (datas, req, res) => {
    try {
        // console.log(datas);
        const { data, error } = await resend.emails.send({
            from: "no-reply@bilalellahi.com",
            to: ["bilalillahi25@gmail.com", datas.email],
            subject: datas.subject,
            html: `<h5>Chat Form no-reply.bilalellahi.com</h5>
                <h3>${datas.message}</h3>
                <p>${datas.email}</p>
                <p>${datas.name}</p>
                ${datas.html}`
        });

        if (error) {
            return res.status(400).json({ message: error });
        }

        // res.status(200).json({ message: "Success", data });
    } catch (error) {
        console.error("Error sending email: ", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports = { resendEmail };
