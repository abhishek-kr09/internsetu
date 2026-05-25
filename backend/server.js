const app = require('./src/app.js');
const connectDB = require('./src/db/db.js');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}


startServer().catch((error) => {
    console.error("Error starting server:", error);
    process.exit(1);
});

