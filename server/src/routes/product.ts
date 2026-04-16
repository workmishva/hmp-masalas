import express from "express";
import upload from "../middlewares/upload";

const router = express.Router();

router.post("/add-product", upload.single("image"), async (req, res) => {

    const product = {
        name: req.body.name,
        price: req.body.price,
        image: (req.file as any).path
    };

    // MongoDB save example
    // await Product.create(product);

    res.json({
        message: "Product added successfully",
        product
    });

});

export default router;