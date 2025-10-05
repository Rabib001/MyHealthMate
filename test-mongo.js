const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://rabibh59_db_user:0fRrylgP6HF41aJP@myhealthmate.ljntxuf.mongodb.net/?retryWrites=true&w=majority&appName=MyHealthMate"; // paste your full connection string

async function test() {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    console.log("✅ Connected successfully");
    
    const db = client.db("symptom-checker");
    const result = await db.collection("test").insertOne({ test: "data", time: new Date() });
    console.log("✅ Inserted:", result.insertedId);
    
    await client.close();
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

test();