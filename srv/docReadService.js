require('dotenv').config();

const cds = require('@sap/cds');
const { SELECT, UPDATE } = require('@sap/cds/lib/ql/cds-ql');

/*const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});*/

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

module.exports = class docReader extends cds.ApplicationService { 
init() {
  const { zdocument } = this.entities;

  // 🔹 CREATE hook → auto-generate embeddings
  this.before('CREATE', zdocument , async (req) => {

  let content = req.data.content;

  // Uploaded file stream → text
  if (content && typeof content.pipe === 'function') {

    const mammoth = require("mammoth");

    const chunks = [];

    for await (const chunk of content) {
      chunks.push(chunk);
    }

   // content = Buffer.concat(chunks).toString('utf8');
   const dataBuffer = Buffer.concat(chunks);

const result = await mammoth.extractRawText({
  buffer: dataBuffer
});
  

 // const result = await mammoth.extractRawText({ buffer: dataBuffer });

console.log('Mammoth messages:', result.messages); // shows warnings/errors
console.log('Extracted length:', result.value?.length);
console.log('Preview:', result.value?.slice(0, 200));
req.data.extractedText = JSON.stringify(
  result.value
);


content = result.value;
  }
   /* const response = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: content
    });

    req.data.embedding = JSON.stringify(
      response.data[0].embedding
    );
  });*/



  //For Gemini
  const response = await ai.models.embedContent({
  model: "gemini-embedding-001",
  contents: content
});

req.data.embedding = JSON.stringify(
  response.embeddings[0].values
);


});


  // 🔹 ASK action → RAG pipeline
  this.on('ask', async req=> {

    const question = req.data.Question;

    const docID = req.params[0].ID;

    if (!question) return "Question is required";

     // Step 2: Fetch docs
    const docs = await SELECT.from(zdocument).where({ID:docID}).limit(100);

    // Step 1: Question embedding
    /*const embeddingResponse = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: question
    });

    const queryVector = embeddingResponse.data[0].embedding;*/

    const embeddingResponse = await ai.models.embedContent({
  model: "gemini-embedding-001",
  contents: question
});

const queryVector =
  embeddingResponse.embeddings[0].values;

   
    /*  Now we got 2 vectors 
     A -> Question
     B -> Document which we saved
      Note that we are using same AI to convert vector both will have same length

     Now the formula is A*B/sqrt A * sqrt B -> this gives matched result 
     (-1 -> Opposite 
       0 -> Unmatched
       1 -> Matched )
      
       doing above logic below.
    */
    function cosineSim(a, b) {
      let dot = 0, magA = 0, magB = 0;

      for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        magA += a[i] * a[i];
        magB += b[i] * b[i];
      }

      return dot / (Math.sqrt(magA) * Math.sqrt(magB));
    }

    const scoredDocs = docs
      .filter(d => d.embedding)
      .map(doc => ({
        content: doc.extractedText,
        score: cosineSim(queryVector, JSON.parse(doc.embedding))
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const context = scoredDocs.map(d => d.content).join("\n---\n");

    if (!context) return "No relevant context found";

    // Step 4: LLM response
    /*const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      //model : "gemini-2.5-flash" ,
      messages: [
        {
          role: "system",
          content: "Answer ONLY using the provided context."
        },
        {
          role: "user",
          content: `Context:\n${context}\n\nQuestion: ${question}`
        }
      ]
    });

    return completion.choices[0].message.content;*/

  const completion = await ai.models.generateContent({
    model: "gemini-2.5-flash",
     contents: 
     `Answer ONLY using the provided context.
        Context:
           ${context}

        Question:
          ${question}`

       });

         await UPDATE(zdocument).set({aiAnwer:completion.text}).where({ID:docID});

return completion.text;

    });      
 

return super.init()
}}
