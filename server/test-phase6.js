import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

const API_URL = 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  validateStatus: () => true,
});

async function runTests() {
  console.log('--- STARTING PHASE 6 RAG & VECTOR SEARCH TESTS ---\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  const scratchDir = path.resolve(process.cwd(), 'scratch_rag_test');
  if (!fs.existsSync(scratchDir)) {
    fs.mkdirSync(scratchDir, { recursive: true });
  }

  const sampleDocPath = path.join(scratchDir, 'STAT301_Hypothesis_Testing.md');
  const sampleDocContent = `# Chapter 4: Hypothesis Testing and Statistical Inference

## 1. Introduction to Hypothesis Testing
Hypothesis testing is a systematic statistical method used in inferential statistics to determine whether there is enough mathematical evidence in a sample of data to infer that a certain condition is true for an entire population. It allows scientists and researchers to assess the plausibility of a given hypothesis.

The foundation of hypothesis testing rests on comparing two mutually exclusive statements about a population: the null hypothesis and the alternative hypothesis.

## 2. Null Hypothesis (H0) and Alternative Hypothesis (H1)
The null hypothesis, denoted as H0, usually represents a hypothesis of no effect, no relationship, or status quo. In scientific experiments, the null hypothesis assumes that any observed difference in the sample data is due to random sampling chance rather than a genuine effect.

In contrast, the alternative hypothesis, denoted as H1 or Ha, represents the claim that there is a genuine treatment effect, a significant difference between groups, or a measurable relationship between variables.

## 3. The P-Value and Alpha Decision Threshold
The p-value is the probability of obtaining test results at least as extreme as the results actually observed, under the assumption that the null hypothesis is completely correct.

A smaller p-value provides stronger evidence in favor of rejecting the null hypothesis. The significance level, commonly denoted as alpha, is typically set at 0.05 or 0.01 prior to conducting the experiment. When the p-value is less than or equal to alpha, the result is statistically significant.
`;
  fs.writeFileSync(sampleDocPath, sampleDocContent, 'utf8');

  try {
    // 1. Login as Instructor & Student
    const instLogin = await client.post('/auth/login', {
      email: 'dr.smith@jnlms.edu',
      password: 'Instructor123!',
    });
    const instCookie = instLogin.headers['set-cookie'];
    assert(instLogin.status === 200, 'Instructor logged in');

    const studentLogin = await client.post('/auth/login', {
      email: 'student@jnlms.edu',
      password: 'Student123!',
    });
    const studentCookie = studentLogin.headers['set-cookie'];
    assert(studentLogin.status === 200, 'Student logged in');

    // 2. Get STAT301 Course ID
    const coursesRes = await client.get('/courses', {
      headers: { Cookie: instCookie },
    });
    const coursesList = coursesRes.data.data.courses || coursesRes.data.data;
    const statCourse = coursesList.find((c) => c.code === 'STAT301');
    assert(Boolean(statCourse), 'Found STAT301 course');
    const courseId = statCourse.id;

    // 3. Upload sample document to STAT301
    const form = new FormData();
    form.append('courseId', courseId);
    form.append('title', 'Chapter 4 Hypothesis Testing Notes');
    form.append('file', fs.createReadStream(sampleDocPath));

    const uploadRes = await client.post('/documents/upload', form, {
      headers: {
        ...form.getHeaders(),
        Cookie: instCookie,
      },
    });
    assert(uploadRes.status === 201, 'Instructor uploaded course material');
    const documentId = uploadRes.data.data.id;

    // Wait for document to process and pgvector embeddings to be generated
    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 600));
      const pollRes = await client.get(`/documents/${documentId}`, {
        headers: { Cookie: instCookie },
      });
      if (pollRes.data?.data?.status === 'READY') break;
    }

    // 4. Test pgvector similarity search
    const searchRes = await client.get(`/ai/search?query=hypothesis%20testing%20null%20alternative%20p-value&courseId=${courseId}`, {
      headers: { Cookie: studentCookie },
    });
    assert(searchRes.status === 200, 'pgvector similarity search executed successfully');
    const searchChunks = searchRes.data.data || [];
    assert(searchChunks.length > 0, 'pgvector successfully retrieved semantic chunks from course document');
    console.log(`   (pgvector retrieved ${searchChunks.length} chunks. Top similarity: ${searchChunks[0].similarity})`);

    // 5. Send chat message to AI Assistant with RAG grounding
    const chatRes = await client.post('/ai/chat', {
      courseId,
      message: 'What is the null hypothesis and what does the p-value mean in our course?',
    }, {
      headers: { Cookie: studentCookie },
    });

    assert(chatRes.status === 200, 'AI Assistant processed RAG chat query');
    const chatData = chatRes.data.data;
    assert(Boolean(chatData.conversationId), 'Created AI Conversation');
    assert(Boolean(chatData.message?.content), 'AI Assistant generated grounded response');
    assert(Array.isArray(chatData.citations) && chatData.citations.length > 0, 'Grounded citations attached to assistant response');
    console.log(`   (AI Response Preview: "${chatData.message.content.slice(0, 100)}...")`);
    console.log(`   (Attached Citations: ${chatData.citations.length}, Source 1: "${chatData.citations[0].title}")`);

    const conversationId = chatData.conversationId;

    // 6. Send follow-up message with conversation memory
    const followUpRes = await client.post('/ai/chat', {
      conversationId,
      message: 'Can you explain the alpha threshold of 0.05?',
    }, {
      headers: { Cookie: studentCookie },
    });

    assert(followUpRes.status === 200, 'Follow-up message processed with conversation context');
    assert(followUpRes.data.data.conversationId === conversationId, 'Maintained same conversation thread ID');

    // 7. List conversations
    const convListRes = await client.get('/ai/conversations', {
      headers: { Cookie: studentCookie },
    });
    assert(convListRes.status === 200 && convListRes.data.data.length > 0, 'Listed user AI conversations');

    // 8. Get conversation details & transcript
    const convDetailRes = await client.get(`/ai/conversations/${conversationId}`, {
      headers: { Cookie: studentCookie },
    });
    assert(convDetailRes.status === 200 && convDetailRes.data.data.messages.length >= 4, 'Retrieved full conversation transcript');

    // 9. Delete conversation
    const deleteConvRes = await client.delete(`/ai/conversations/${conversationId}`, {
      headers: { Cookie: studentCookie },
    });
    assert(deleteConvRes.status === 200, 'Deleted AI conversation');

    // Clean up scratch directory
    try {
      fs.rmSync(scratchDir, { recursive: true, force: true });
    } catch (e) {}

  } catch (error) {
    console.error('Test execution error:', error);
    failed++;
  }

  console.log(`\n--- PHASE 6 TESTS FINISHED: ${passed} PASSED, ${failed} FAILED ---`);
  if (failed > 0) process.exit(1);
}

runTests();
