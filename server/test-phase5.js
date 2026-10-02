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
  console.log('--- STARTING PHASE 5 INTEGRATION TESTS ---\n');
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

  // Temporary sample files for testing
  const scratchDir = path.resolve(process.cwd(), 'scratch_tests');
  if (!fs.existsSync(scratchDir)) {
    fs.mkdirSync(scratchDir, { recursive: true });
  }

  const sampleMarkdownPath = path.join(scratchDir, 'STAT301_Hypothesis_Testing.md');
  const sampleMarkdownContent = `# Chapter 4: Hypothesis Testing and Statistical Inference

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
  fs.writeFileSync(sampleMarkdownPath, sampleMarkdownContent, 'utf8');

  try {
    // 1. Login as Instructor
    const instLogin = await client.post('/auth/login', {
      email: 'dr.smith@jnlms.edu',
      password: 'Instructor123!',
    });
    const instCookie = instLogin.headers['set-cookie'];
    assert(instLogin.status === 200, 'Instructor logged in');

    // 2. Login as Student
    const studentLogin = await client.post('/auth/login', {
      email: 'student@jnlms.edu',
      password: 'Student123!',
    });
    const studentCookie = studentLogin.headers['set-cookie'];
    assert(studentLogin.status === 200, 'Student logged in');

    // Get STAT301 course ID
    const coursesRes = await client.get('/courses', {
      headers: { Cookie: instCookie },
    });
    const coursesList = coursesRes.data.data.courses || coursesRes.data.data;
    const statCourse = coursesList.find((c) => c.code === 'STAT301');
    assert(Boolean(statCourse), 'Found STAT301 course');
    const courseId = statCourse.id;

    // 3. Upload Document as Instructor
    const form = new FormData();
    form.append('courseId', courseId);
    form.append('title', 'Chapter 4 Hypothesis Testing Lecture Notes');
    form.append('file', fs.createReadStream(sampleMarkdownPath));

    const uploadRes = await client.post('/documents/upload', form, {
      headers: {
        ...form.getHeaders(),
        Cookie: instCookie,
      },
    });

    assert(uploadRes.status === 201, 'Instructor uploaded document');
    const documentId = uploadRes.data.data.id;
    console.log(`   (Document uploaded with ID: ${documentId}, initial status: ${uploadRes.data.data.status})`);

    // 4. Poll/Wait for Document to be READY (BullMQ worker or fallback processing)
    let processedDoc = null;
    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 600));
      const pollRes = await client.get(`/documents/${documentId}`, {
        headers: { Cookie: instCookie },
      });
      if (pollRes.data.data.status === 'READY') {
        processedDoc = pollRes.data.data;
        break;
      }
    }

    assert(Boolean(processedDoc && processedDoc.status === 'READY'), 'Document status transitioned to READY');

    // 5. Fetch Document Chunks
    const chunksRes = await client.get(`/documents/${documentId}/chunks`, {
      headers: { Cookie: instCookie },
    });
    assert(chunksRes.status === 200 && chunksRes.data.data.length > 0, 'Document chunks generated and saved');
    const chunks = chunksRes.data.data;
    console.log(`   (Generated ${chunks.length} semantic chunks. Sample chunk: "${chunks[0].content.slice(0, 60)}...")`);

    assert(typeof chunks[0].chunkIndex === 'number' && chunks[0].tokenCount > 0, 'Chunks have chunkIndex and estimated tokenCount');

    // 6. Student views course documents
    const studDocsRes = await client.get(`/documents?courseId=${courseId}`, {
      headers: { Cookie: studentCookie },
    });
    const foundInStudentList = studDocsRes.data.data.find((d) => d.id === documentId);
    assert(Boolean(foundInStudentList), 'Student can view the course document in their library');

    // 7. Student uploads personal study notes
    const studentNotesPath = path.join(scratchDir, 'Student_Personal_Revision.txt');
    fs.writeFileSync(studentNotesPath, 'Key formula to remember for the midterm exam: z = (x_bar - mu) / (sigma / sqrt(n)). Always check sample size!', 'utf8');

    const studForm = new FormData();
    studForm.append('courseId', courseId);
    studForm.append('title', 'My Midterm Exam Revision Sheet');
    studForm.append('file', fs.createReadStream(studentNotesPath));

    const studUploadRes = await client.post('/documents/upload', studForm, {
      headers: {
        ...studForm.getHeaders(),
        Cookie: studentCookie,
      },
    });
    assert(studUploadRes.status === 201, 'Student uploaded personal study document');
    const studentDocId = studUploadRes.data.data.id;

    // Wait for student doc to process
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 500));
      const res = await client.get(`/documents/${studentDocId}`, {
        headers: { Cookie: studentCookie },
      });
      if (res.data.data.status === 'READY') break;
    }

    // 8. Search documents
    const searchRes = await client.get('/documents?search=Hypothesis', {
      headers: { Cookie: studentCookie },
    });
    assert(searchRes.status === 200 && searchRes.data.data.length >= 1, 'Document search by keyword succeeded');

    // 9. Student deletes their personal document
    const deleteRes = await client.delete(`/documents/${studentDocId}`, {
      headers: { Cookie: studentCookie },
    });
    assert(deleteRes.status === 200, 'Student deleted their document');

    // Clean up sample scratch directory
    try {
      fs.rmSync(scratchDir, { recursive: true, force: true });
    } catch (e) {}

  } catch (error) {
    console.error('Test execution error:', error);
    failed++;
  }

  console.log(`\n--- PHASE 5 TESTS FINISHED: ${passed} PASSED, ${failed} FAILED ---`);
  if (failed > 0) process.exit(1);
}

runTests();
