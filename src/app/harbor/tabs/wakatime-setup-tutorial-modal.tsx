import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  getInstallCommand,
  Os,
  osFromAgent,
  SinglePlatform,
} from "@/app/utils/wakatime-setup/tutorial-utils.client";
import { hasHb } from "@/app/utils/wakatime-setup/tutorial-utils";
import {
  handleEmailSubmission,
  markArrpheusReadyToInvite,
} from "../../marketing/marketing-utils";
import JSConfetti from "js-confetti";
import { LoadingSpinner } from "../../../components/ui/loading_spinner";
import Platforms from "@/app/utils/wakatime-setup/platforms";

export default function WakatimeSetupTutorialModal({
  email,
  closeModal,
}: {
  email: string;
  closeModal: () => void;
}) {
  const [userOs, setUserOs] = useState<Os>("unknown");
  const [personRecordId, setPersonRecordId] = useState<string>();
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);
  const [hasRecvHb, setHasRecvHb] = useState(false);
  const [wakaKey, setWakaKey] = useState<string | null>(null);
  const [instructions, setInstructions] = useState<any | null>(null);
  const confettiRef = useRef<JSConfetti | null>(null);

  const triggerConfetti = () => {
    confettiRef.current?.addConfetti({
      emojis: ["🌟", "✨", "💫", "🎉"],
      emojiSize: 50,
      confettiNumber: 50,
    });
  };

  const handleContinueFromModal = async (personRecordId: string) => {
    try {
      console.log("running handleContinueFromModal");
      await markArrpheusReadyToInvite(personRecordId);
      triggerConfetti();
    } catch (err) {
      console.error("Error while handling modal continue:", err);
      throw err;
    }
  };

  useEffect(() => {
    confettiRef.current = new JSConfetti();

    const mobile = navigator.userAgent.toLowerCase().includes("mobile");
    const os = osFromAgent();
    setUserOs(os);
    setShowAllPlatforms(os === "unknown");

    (async () => {
      const emailSubmissionResult = await handleEmailSubmission(email, mobile);
      if (!emailSubmissionResult) return;

      console.log("Email submission result:", emailSubmissionResult);
      setPersonRecordId(emailSubmissionResult.personRecordId);

      setWakaKey(emailSubmissionResult.apiKey);
      setInstructions(getInstallCommand(userOs, emailSubmissionResult.apiKey));

      if (!emailSubmissionResult.username) {
        console.error("no username while trying to sign up");
        return;
      }

      if (mobile) {
        setHasRecvHb(true);
        await handleContinueFromModal(emailSubmissionResult.personRecordId);
        return;
      }

      while (true) {
        const hasData = await hasHb(
          emailSubmissionResult.username,
          emailSubmissionResult.apiKey,
        );
        console.log("Hb check:", hasData);
        if (hasData) {
          await handleContinueFromModal(emailSubmissionResult.personRecordId);
          setHasRecvHb(true);
          break;
        }

        await new Promise((r) => setTimeout(r, 1_000));
      }
    })();
  }, []);

  return wakaKey ? (
    hasRecvHb ? (
      <div>
        <p className="text-3xl mb-2">Check your email!</p>
        <p>You should see an invite to the Hack Club Slack.</p>

        <img
          src="/party-orpheus.svg"
          alt="a partying dinosaur"
          className="mt-8 mx-auto w-1/2"
        />

        <Button onClick={closeModal} className="ml-auto">
          Dismiss
        </Button>
      </div>
    ) : (
      <>
        <div>
          <h1 className="text-2xl font-bold mb-4">
            {"You're on your way to sail the seas!"}
          </h1>
          <p className="text-base mb-4">
            In order to get rewarded for your time spent coding, we need to know
            when {"you're"} coding! We will do this with an <i>arrsome</i>{" "}
            extension in your code editor!
          </p>

          <Platforms wakaKey={wakaKey} />

          <video
            src="/videos/Waka Setup Script.mp4"
            autoPlay
            loop
            playsInline
            className="mt-8 rounded shadow"
          />
        </div>

        <p className="mt-2 text-base">
          Waiting for the setup script to be pasted into your terminal...
        </p>

        <Button
          className="mt-4"
          disabled={!personRecordId}
          onClick={async () => {
            await handleContinueFromModal(personRecordId!);
            setHasRecvHb(true);
          }}
        >
          Or, skip for now
        </Button>
      </>
    )
  ) : (
    <div className="flex flex-col items-center justify-center gap-4 text-2xl text-center w-full">
      <p>Loading</p>
      <LoadingSpinner />
    </div>
  );
}
