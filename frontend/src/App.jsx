import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import './App.css'

function App() {
  const [mode, setMode] = useState('screening')

  const [files, setFiles] = useState([])
  const [jobDescription, setJobDescription] = useState('')
  const [results, setResults] = useState([])

  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isScreening, setIsScreening] = useState(false)

  const [error, setError] = useState('')
  const [uploadMessage, setUploadMessage] = useState('')

  // -------------------------
  // Q&A STATE
  // -------------------------

  const [resumes, setResumes] = useState([])
  const [selectedResume, setSelectedResume] = useState('')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [isAsking, setIsAsking] = useState(false)
  const [qaError, setQaError] = useState('')

  // -------------------------
  // LOAD RESUMES
  // -------------------------

  const loadResumes = async () => {
    try {
      const response = await fetch(
        'http://127.0.0.1:8000/resumes'
      )

      if (!response.ok) {
        throw new Error('Failed to load resumes.')
      }

      const data = await response.json()

      setResumes(data)

      if (
        data.length > 0 &&
        !selectedResume
      ) {
        setSelectedResume(
          data[0].resume_id
        )
      }
    } catch (error) {
      console.error(error)

      setQaError(
        'Unable to load resumes. Make sure the FastAPI server is running.'
      )
    }
  }

  // -------------------------
  // LOAD RESUMES FOR Q&A
  // -------------------------

  useEffect(() => {
    if (mode === 'qa') {
      loadResumes()
    }
  }, [mode])

  // -------------------------
  // FILE HANDLING
  // -------------------------

  const handleFiles = (selectedFiles) => {
    const pdfFiles = Array.from(
      selectedFiles
    ).filter(
      (file) =>
        file.type === 'application/pdf'
    )

    setFiles((currentFiles) => {
      const existingNames = new Set(
        currentFiles.map(
          (file) => file.name
        )
      )

      const newFiles =
        pdfFiles.filter(
          (file) =>
            !existingNames.has(
              file.name
            )
        )

      return [
        ...currentFiles,
        ...newFiles
      ]
    })
  }

  const handleFileChange = (event) => {
    handleFiles(
      event.target.files
    )
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (event) => {
    event.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragging(false)

    handleFiles(
      event.dataTransfer.files
    )
  }

  const removeFile = (fileName) => {
    setFiles((currentFiles) =>
      currentFiles.filter(
        (file) =>
          file.name !== fileName
      )
    )
  }

  // -------------------------
  // UPLOAD RESUMES
  // -------------------------

  const handleUpload = async () => {
    setUploadMessage('')

    if (files.length === 0) {
      setUploadMessage(
        'Please select at least one PDF resume.'
      )
      return
    }

    const formData =
      new FormData()

    files.forEach((file) => {
      formData.append(
        'files',
        file
      )
    })

    setIsUploading(true)

    try {
      const response =
        await fetch(
          'http://127.0.0.1:8000/upload',
          {
            method: 'POST',
            body: formData,
          }
        )

      if (!response.ok) {
        throw new Error(
          'Upload failed.'
        )
      }

      const data =
        await response.json()

      console.log(
        'Upload Results:',
        data
      )

      const successful =
        data.filter(
          (item) => item.success
        )

      const failed =
        data.filter(
          (item) => !item.success
        )

      if (successful.length > 0) {
        setUploadMessage(
          `${successful.length} resume${
            successful.length !== 1
              ? 's'
              : ''
          } uploaded and indexed successfully.`
        )

        // Refresh Q&A resume list
        await loadResumes()
      }

      if (failed.length > 0) {
        setUploadMessage(
          failed
            .map(
              (item) =>
                item.message
            )
            .join(' ')
        )
      }
    } catch (error) {
      console.error(error)

      setUploadMessage(
        'Unable to connect to the Resume AI backend.'
      )
    } finally {
      setIsUploading(false)
    }
  }

  // -------------------------
  // SCREEN RESUMES
  // -------------------------

  const handleScreening =
    async () => {
      setError('')
      setResults([])

      if (
        !jobDescription.trim()
      ) {
        setError(
          'Please enter a job description before screening.'
        )
        return
      }

      setIsScreening(true)

      try {
        const response =
          await fetch(
            'http://127.0.0.1:8000/screen',
            {
              method: 'POST',
              headers: {
                'Content-Type':
                  'application/json',
              },
              body: JSON.stringify(
                {
                  job_description:
                    jobDescription,
                }
              ),
            }
          )

        if (!response.ok) {
          throw new Error(
            'Screening request failed.'
          )
        }

        const data =
          await response.json()

        setResults(data)

        if (
          data.length === 0
        ) {
          setError(
            'No matching resumes were found.'
          )
        }
      } catch (error) {
        console.error(error)

        setError(
          'Unable to connect to the Resume AI backend. Make sure the FastAPI server is running.'
        )
      } finally {
        setIsScreening(false)
      }
    }

  // -------------------------
  // ASK QUESTION
  // -------------------------

  const handleAskQuestion =
    async () => {
      setQaError('')
      setAnswer('')

      if (!selectedResume) {
        setQaError(
          'Please select a resume first.'
        )
        return
      }

      if (!question.trim()) {
        setQaError(
          'Please enter a question.'
        )
        return
      }

      setIsAsking(true)

      try {
        const response =
          await fetch(
            'http://127.0.0.1:8000/ask',
            {
              method: 'POST',
              headers: {
                'Content-Type':
                  'application/json',
              },
              body: JSON.stringify(
                {
                  resume_id:
                    selectedResume,
                  question:
                    question,
                }
              ),
            }
          )

        if (!response.ok) {
          throw new Error(
            'Question request failed.'
          )
        }

        const data =
          await response.json()

        if (data.error) {
          setQaError(
            data.error
          )
          return
        }

        setAnswer(
          data.answer
        )
      } catch (error) {
        console.error(error)

        setQaError(
          'Unable to connect to the Resume AI backend. Make sure the FastAPI server is running.'
        )
      } finally {
        setIsAsking(false)
      }
    }

  // -------------------------
  // UI
  // -------------------------

  return (
    <main className="app">

      <header className="header">
        <h1>
          Resume AI
        </h1>

        <p>
          AI-powered resume
          screening and analysis
        </p>
      </header>


      {/* MODE SWITCH */}

      <div className="mode-toggle">

        <button
          className={`mode-button ${
            mode === 'screening'
              ? 'active'
              : ''
          }`}
          onClick={() =>
            setMode(
              'screening'
            )
          }
        >
          Resume Screening
        </button>


        <button
          className={`mode-button ${
            mode === 'qa'
              ? 'active'
              : ''
          }`}
          onClick={() =>
            setMode('qa')
          }
        >
          Resume Q&A
        </button>

      </div>


      {/* =========================
          SCREENING MODE
      ========================= */}

      {mode === 'screening' && (
        <>

          {/* UPLOAD */}

          <section className="upload-card">

            <h2>
              Upload Resumes
            </h2>

            <p>
              Upload PDF resumes
              to analyze candidates.
            </p>


            <label
              className={`drop-zone ${
                isDragging
                  ? 'dragging'
                  : ''
              }`}
              onDragOver={
                handleDragOver
              }
              onDragLeave={
                handleDragLeave
              }
              onDrop={
                handleDrop
              }
            >

              <input
                type="file"
                multiple
                accept=".pdf"
                onChange={
                  handleFileChange
                }
                hidden
              />


              <div className="upload-icon">
                ↑
              </div>


              <strong>
                Drop your resumes here
              </strong>


              <span>
                or click to browse
              </span>


              <small>
                PDF files only
              </small>

            </label>


            {files.length > 0 && (
              <div className="file-list">

                <h3>
                  Selected Resumes (
                  {files.length}
                  )
                </h3>


                {files.map(
                  (file) => (

                    <div
                      className="file-item"
                      key={
                        file.name
                      }
                    >

                      <span>
                        📄{' '}
                        {file.name}
                      </span>


                      <button
                        type="button"
                        className="remove-file"
                        onClick={() =>
                          removeFile(
                            file.name
                          )
                        }
                      >
                        ×
                      </button>

                    </div>

                  )
                )}


                <button
                  type="button"
                  className="screen-button"
                  onClick={
                    handleUpload
                  }
                  disabled={
                    isUploading
                  }
                >

                  {isUploading
                    ? 'Uploading...'
                    : 'Upload & Index Resumes'}

                </button>


                {uploadMessage && (
                  <p className="status-message">
                    {
                      uploadMessage
                    }
                  </p>
                )}

              </div>
            )}

          </section>


          {/* JOB DESCRIPTION */}

          <section className="job-card">

            <h2>
              Job Description
            </h2>


            <textarea
              placeholder="Enter the job description here..."
              rows="8"
              value={
                jobDescription
              }
              onChange={(event) =>
                setJobDescription(
                  event.target.value
                )
              }
            />


            <button
              className="screen-button"
              onClick={
                handleScreening
              }
              disabled={
                isScreening
              }
            >

              {isScreening
                ? 'Analyzing Resumes...'
                : 'Screen Resumes'}

            </button>


            {isScreening && (
              <p className="loading-message">
                AI is analyzing
                the indexed
                resumes. This may
                take a moment...
              </p>
            )}


            {error && (
              <p className="error-message">
                {error}
              </p>
            )}

          </section>


          {/* RESULTS */}

          {results.length > 0 && (

            <section className="results-section">

              <h2>
                Screening Results
              </h2>


              <p>
                {results.length}{' '}
                candidate
                {results.length !==
                1
                  ? 's'
                  : ''}{' '}
                found
              </p>


              <div className="results-list">

                {results.map(
                  (
                    result,
                    index
                  ) => {

                    const ranking =
                      result.ranking

                    return (

                      <article
                        className="result-card"
                        key={
                          result.resume_id
                        }
                      >

                        <div className="result-header">

                          <div>

                            <span className="candidate-position">
                              #
                              {index +
                                1}
                            </span>


                            <h3>
                              {result.pdf_path
                                .split(
                                  /[\\/]/
                                )
                                .pop()
                                .replace(
                                  /\.pdf$/i,
                                  ''
                                )
                                .replace(
                                  /[-_]+/g,
                                  ' '
                                )
                                .replace(
                                  /\b\w/g,
                                  (
                                    letter
                                  ) =>
                                    letter.toUpperCase()
                                )}
                            </h3>

                          </div>


                          <div className="score">
                            {
                              ranking.score
                            }%
                          </div>

                        </div>


                        <div className="result-content">

                          <h4>
                            Matched Skills
                          </h4>


                          <div className="skills">

                            {ranking.matched_skills.map(
                              (
                                skill,
                                skillIndex
                              ) => (

                                <span
                                  className="skill matched"
                                  key={
                                    skillIndex
                                  }
                                >
                                  {
                                    skill
                                  }
                                </span>

                              )
                            )}

                          </div>


                          <h4>
                            Missing Skills
                          </h4>


                          <div className="skills">

                            {ranking.missing_skills.map(
                              (
                                skill,
                                skillIndex
                              ) => (

                                <span
                                  className="skill missing"
                                  key={
                                    skillIndex
                                  }
                                >
                                  {
                                    skill
                                  }
                                </span>

                              )
                            )}

                          </div>


                          <h4>
                            Relevant Experience
                          </h4>


                          <ul>

                            {ranking.relevant_experience.map(
                              (
                                experience,
                                experienceIndex
                              ) => (

                                <li
                                  key={
                                    experienceIndex
                                  }
                                >
                                  {
                                    experience
                                  }
                                </li>

                              )
                            )}

                          </ul>


                          <h4>
                            Overall Assessment
                          </h4>


                          <p className="assessment">
                            {
                              ranking.overall_assessment
                            }
                          </p>

                        </div>

                      </article>

                    )
                  }
                )}

              </div>

            </section>

          )}

        </>
      )}


      {/* =========================
          Q&A MODE
      ========================= */}

      {mode === 'qa' && (

        <>

          <section className="job-card">

            <h2>
              Resume Q&A
            </h2>

            <p>
              Ask questions about
              a specific resume.
            </p>


            {/* RESUME SELECTOR */}

            <label className="qa-label">
              Select Resume
            </label>


            <select
              className="qa-select"
              value={
                selectedResume
              }
              onChange={(
                event
              ) => {

                setSelectedResume(
                  event.target.value
                )

                setAnswer('')
                setQaError('')
              }}
            >

              <option value="">
                Select a resume
              </option>


              {resumes.map(
                (resume) => (

                  <option
                    key={
                      resume.resume_id
                    }
                    value={
                      resume.resume_id
                    }
                  >
                    {
                      resume.display_name
                    }
                  </option>

                )
              )}

            </select>


            {/* QUESTION */}

            <label className="qa-label">
              Ask a Question
            </label>


            <textarea
              placeholder="What experience does this candidate have with React?"
              rows="6"
              value={
                question
              }
              onChange={(event) =>
                setQuestion(
                  event.target.value
                )
              }
            />


            <button
              className="screen-button"
              onClick={
                handleAskQuestion
              }
              disabled={
                isAsking
              }
            >

              {isAsking
                ? 'Thinking...'
                : 'Ask AI'}

            </button>


            {isAsking && (
              <p className="loading-message">
                AI is searching the
                resume and
                generating an
                answer...
              </p>
            )}


            {qaError && (
              <p className="error-message">
                {qaError}
              </p>
            )}

          </section>


          {/* AI ANSWER */}

          {answer && (

            <section className="job-card qa-answer-card">

              <h2>
                AI Answer
              </h2>

              <div className="qa-answer">
                <ReactMarkdown>
                  {answer}
                </ReactMarkdown>
              </div>

            </section>

          )}

        </>
      )}

    </main>
  )
}

export default App