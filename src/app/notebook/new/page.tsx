"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import logo from "../../../../logo/Logo Noir sans Fond.webp";

import { StepProgressBar } from "../components/common/StepProgressBar";
import { ToastContainer, useToast } from "../components/common/Toast";
import { Step1_ChooseProtocol } from "../components/Step1_ChooseProtocol";
import { Step2_UploadProtocol } from "../components/Step2_UploadProtocol";
import { Step3_ProtocolEditor } from "../components/Step3_ProtocolEditor";
import { Step4_ExperimentalNotes } from "../components/Step4_ExperimentalNotes";
import { Step5_Report } from "../components/Step5_Report";
import { Step6_Export } from "../components/Step6_Export";
import { Step7_UploadResults } from "../components/Step7_UploadResults";

interface Report {
  title: string;
  date: string;
  steps: Array<{
    stepNumber: number;
    expectedAction: string;
    actualObservation: string;
    parameters: string[];
    deviation: string | null;
  }>;
  summary: string;
  additionalNotes: string;
}

export default function NotebookPage() {
  const { toasts, addToast, dismissToast } = useToast();

  // Flow state
  const [currentStep, setCurrentStep] = useState(1);
  const [maxReachedStep, setMaxReachedStep] = useState(1);

  // Data that flows between steps
  const [protocolId, setProtocolId] = useState<string | null>(null);
  const [protocolTitle, setProtocolTitle] = useState("");
  const [protocolContent, setProtocolContent] = useState("");
  const [isExistingProtocol, setIsExistingProtocol] = useState(false);
  const [experimentId, setExperimentId] = useState<string | null>(null);
  const [experimentNotes, setExperimentNotes] = useState("");
  const [report, setReport] = useState<Report | null>(null);

  // Completion state
  const [completed, setCompleted] = useState(false);

  const goToStep = useCallback(
    (step: number) => {
      setCurrentStep(step);
      if (step > maxReachedStep) setMaxReachedStep(step);
    },
    [maxReachedStep]
  );

  // Step 1 handlers
  const handleNewProtocol = (title: string) => {
    setProtocolTitle(title);
    setProtocolContent("");
    setProtocolId(null);
    setIsExistingProtocol(false);
    goToStep(2);
  };

  const handleSelectExisting = (protocol: { id: string; title: string; content?: string }) => {
    setProtocolId(protocol.id);
    setProtocolTitle(protocol.title);
    setProtocolContent(protocol.content || "");
    setIsExistingProtocol(true);
    goToStep(3); // Skip upload, go directly to editor
  };

  // Step 2 handler
  const handleTranscribed = (text: string) => {
    setProtocolContent(text);
    goToStep(3);
  };

  // Step 3 handler
  const handleProtocolValidated = async (title: string, content: string, savedId: string) => {
    setProtocolTitle(title);
    setProtocolContent(content);
    setProtocolId(savedId);

    // Create experiment record
    try {
      const res = await fetch("/api/notebook/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ protocol_id: savedId, status: "draft" }),
      });
      const data = await res.json();
      if (res.ok && data.experiment) {
        setExperimentId(data.experiment.id);
      }
    } catch {
      // Continue even if experiment creation fails (DB may not be set up)
    }

    goToStep(4);
  };

  // Step 4 handler
  const handleNotesSubmitted = async (notes: string) => {
    setExperimentNotes(notes);

    // Save notes to experiment
    if (experimentId) {
      try {
        await fetch("/api/notebook/experiments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: experimentId,
            notes_raw: notes,
            status: "notes_uploaded",
          }),
        });
      } catch {
        // Continue
      }
    }

    goToStep(5);
  };

  // Step 5 handler
  const handleReportReady = async (reportData: Report) => {
    setReport(reportData);

    // Save report to experiment
    if (experimentId) {
      try {
        await fetch("/api/notebook/experiments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: experimentId,
            report_json: reportData,
            status: "report_generated",
          }),
        });
      } catch {
        // Continue
      }
    }

    goToStep(6);
  };

  // Step 6 handler
  const handleExportContinue = () => {
    goToStep(7);
  };

  // Step 7 handler
  const handleComplete = () => {
    setCompleted(true);
    addToast("Experiment workflow completed!", "success");
  };

  // Completion screen
  if (completed) {
    return (
      <>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        <div className="min-h-screen" style={{ background: "#faf9f6" }}>
          <header className="flex items-center gap-3 px-6 py-5 md:px-10">
            <Image src={logo} alt="Sylvy" width={36} height={36} />
            <h1 className="text-xl font-semibold tracking-tight" style={{ fontFamily: "Pulp, sans-serif" }}>
              Sylvy <span style={{ color: "#00ac73" }}>Notebook</span>
            </h1>
          </header>

          <main className="flex flex-col items-center justify-center px-6 pt-24 pb-16">
            <div className="flex flex-col items-center gap-6 text-center max-w-md">
              <div className="flex h-24 w-24 items-center justify-center rounded-full" style={{ background: "#d1fae5" }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#00ac73" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold" style={{ fontFamily: "Pulp, sans-serif", color: "#111827" }}>
                All <span style={{ color: "#00ac73" }}>Done!</span>
              </h2>
              <p className="text-base" style={{ color: "#6b7280" }}>
                Your experiment has been fully documented.
                Protocol, notes, report, and results are all saved.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCompleted(false);
                  setCurrentStep(1);
                  setMaxReachedStep(1);
                  setProtocolId(null);
                  setProtocolTitle("");
                  setProtocolContent("");
                  setIsExistingProtocol(false);
                  setExperimentId(null);
                  setExperimentNotes("");
                  setReport(null);
                }}
                className="h-12 rounded-xl px-8 text-base font-semibold"
                style={{ background: "#00ac73", color: "#fff" }}
              >
                Start New Experiment
              </button>
            </div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="min-h-screen" style={{ background: "#faf9f6" }}>
        {/* Header */}
        <header className="flex items-center gap-3 px-6 py-5 md:px-10">
          <Image src={logo} alt="Sylvy" width={36} height={36} />
          <h1
            className="text-xl font-semibold tracking-tight"
            style={{ fontFamily: "Pulp, sans-serif" }}
          >
            Sylvy <span style={{ color: "#00ac73" }}>Notebook</span>
          </h1>
        </header>

        {/* Progress bar */}
        <StepProgressBar
          currentStep={currentStep}
          maxReachedStep={maxReachedStep}
          onStepClick={(step) => {
            if (step <= maxReachedStep) setCurrentStep(step);
          }}
        />

        {/* Step content */}
        <main className="px-6 pt-8 pb-16 md:px-10">
          {currentStep === 1 && (
            <Step1_ChooseProtocol
              onNewProtocol={handleNewProtocol}
              onSelectExisting={handleSelectExisting}
            />
          )}

          {currentStep === 2 && (
            <Step2_UploadProtocol
              protocolTitle={protocolTitle}
              onTranscribed={handleTranscribed}
              onBack={() => setCurrentStep(1)}
              addToast={addToast}
            />
          )}

          {currentStep === 3 && (
            <Step3_ProtocolEditor
              protocolTitle={protocolTitle}
              protocolContent={protocolContent}
              protocolId={protocolId}
              onValidate={handleProtocolValidated}
              onBack={() => setCurrentStep(isExistingProtocol ? 1 : 2)}
              addToast={addToast}
            />
          )}

          {currentStep === 4 && (
            <Step4_ExperimentalNotes
              protocolTitle={protocolTitle}
              onNotesSubmitted={handleNotesSubmitted}
              onBack={() => setCurrentStep(3)}
              addToast={addToast}
            />
          )}

          {currentStep === 5 && (
            <Step5_Report
              protocolTitle={protocolTitle}
              protocolContent={protocolContent}
              experimentNotes={experimentNotes}
              existingReport={report}
              onReportReady={handleReportReady}
              onBack={() => setCurrentStep(4)}
              addToast={addToast}
            />
          )}

          {currentStep === 6 && (
            report ? (
              <Step6_Export
                report={report}
                onContinue={handleExportContinue}
                onBack={() => setCurrentStep(5)}
                addToast={addToast}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
                <p className="text-base font-semibold" style={{ color: "#111827" }}>No report generated yet.</p>
                <p className="text-sm" style={{ color: "#6b7280" }}>Please go back and generate a report first.</p>
                <button
                  type="button"
                  onClick={() => setCurrentStep(5)}
                  className="h-11 rounded-xl px-6 text-sm font-semibold"
                  style={{ background: "#00ac73", color: "#fff" }}
                >
                  ← Back to Report
                </button>
              </div>
            )
          )}

          {currentStep === 7 && (
            <Step7_UploadResults
              experimentId={experimentId}
              protocolSteps={report?.steps.map((s) => s.expectedAction) || []}
              onComplete={handleComplete}
              onBack={() => setCurrentStep(6)}
              addToast={addToast}
            />
          )}
        </main>
      </div>
    </>
  );
}
