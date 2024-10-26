// Import necessary modules and components
import Link from "next/link";
import { createShip, Ship } from "./ship-utils";
import { Button } from "@/components/ui/button";
import JSConfetti from "js-confetti";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getWakaSessions } from "@/app/utils/waka";
import { Checkbox } from "@/components/ui/checkbox";
import { AnimatePresence, motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import Icon from "@hackclub/icons";
import { useSession, signIn, signOut } from "next-auth/react"
import { LoadingSpinner } from "@/components/ui/loading_spinner";
import { SiGithub } from "react-icons/si";

export default function NewShipForm({
  ships,
  canvasRef,
  closeForm,
  session,
}: {
  ships: Ship[];
  canvasRef: any;
  closeForm: any;
  session: any;
}) {
  const [staging, setStaging] = useState(false);
  const confettiRef = useRef<JSConfetti | null>(null);
  const [projects, setProjects] = useState<
    { key: string; total: number }[] | null
  >(null);
  const [selectedProject, setSelectedProject] = useState<{
    key: string;
    total: number;
  } | null>(null);
  const [open, setOpen] = useState(false);
  const [isShipUpdate, setIsShipUpdate] = useState(false);
  const { data: gitSession } = useSession()
  // Initialize confetti on mount
  useEffect(() => {
    confettiRef.current = new JSConfetti({ canvas: canvasRef.current });
  }, [canvasRef.current]);

  // Fetch projects from the API using the Slack ID
  useEffect(() => {
    async function fetchProjects() {
      try {
        const slackId = session.slackId;
        const res = await getWakaSessions();
        const shippedShips = ships
          .filter((s) => s.shipStatus !== "deleted")
          .map((s) => s.wakatimeProjectName)
          .filter((n) => n);
        setProjects(
          res.projects.filter(
            (p: { key: string; total: number }) =>
              p.key != "<<LAST_PROJECT>>" && !shippedShips.includes(p.key),
          ),
        );

        if (sessionStorage.getItem("tutorial") === "true") {
          setProjects((p) => [
            { key: "hack-club-site", total: 123 * 60 * 60 },
            ...p!,
          ]);
        }

        console.log(res);
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    }
    fetchProjects();
  }, [session.slackId]);

  const handleForm = async (formData: FormData) => {
    setStaging(true);
    // // Append the selected project's hours to the form data
    // if (selectedProject) {
    //   formData.append("hours", selectedProject.key.toString());
    // }

    const deploymentUrl = formData.get("deployment_url") as string;
    if (["github.com", "gitlab.com", "bitbucket.org", "testflight.com"].some(domain => deploymentUrl.includes(domain))) {
      toast({
        title: "That's not a demo link!",
        description: "Submit a link to a deployed project or a video demo of what your project is instead!",
      });
      setStaging(false);
      return;
    }

    await createShip(formData);
    confettiRef.current?.addConfetti();
    closeForm();
    window.location.reload();
    setStaging(false);
  };
  const { toast } = useToast();
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">
        {isShipUpdate ? "Update a" : "New"} Ship
      </h1>
      <form action={handleForm} className="space-y-3">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="isShipUpdate"
            id="isShipUpdate"
            onChange={({ target }) => setIsShipUpdate(target.checked)}
          />
          <label htmlFor="isShipUpdate" className="select-none">
            This is an update to an existing project
            <br />
            <span className="opacity-50 text-xs">
              Only select this if {"it's"} a project you started before Low
              Skies and {"haven't"} submitted before.
              <br />
              For example, maybe for Arcade you built a game, and for Low Skies
              you want to Ship an amazing update to it! Click this box and
              describe the update. If you {"don't"} understand this, please ask
              in{" "}
              <Link
                className="text-blue-500"
                href="https://hackclub.slack.com/archives/C07PZNMBPBN"
              >
                #low-skies-help
              </Link>
              !
            </span>
          </label>
        </div>

        <AnimatePresence>
          {isShipUpdate ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "fit-content", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <label htmlFor="updateDescription">
                Description of the update
              </label>
              <textarea
                id="updateDescription"
                name="updateDescription"
                rows={4}
                cols={50}
                minLength={10}
                required
                className="w-full p-2 border rounded"
              ></textarea>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div id="title-field">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            required
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Project Dropdown */}
        <div id="project-field">
          <label htmlFor="project" className="leading-0">
            Select Project <br />
            <span className="text-xs opacity-50">
              If you need to include several of the listed projects in this
              dropdown, you need to update your project labels in the{" "}
              <Link
                className="text-blue-600"
                href="https://waka.hackclub.com"
                target="_blank"
              >
                Wakatime dashboard
              </Link>
            </span>
          </label>

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
                disabled={!projects}
              >
                {selectedProject
                  ? `${selectedProject.key} (${(selectedProject.total / 60 / 60).toFixed(1)} hrs)`
                  : projects
                    ? "Select project..."
                    : "Loading projects..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 z-[9998]">
              <Command>
                <CommandInput placeholder="Search projects..." />
                <CommandList>
                  <CommandEmpty className="p-4">
                    <p>
                      {"You don't seem to have any tracked projects."}
                      <br />
                      {"Start coding a project and it'll appear here!"}
                    </p>

                    <img
                      className="mx-auto mt-4"
                      width={128}
                      src="/dino_debugging.svg"
                      alt="a confused dinosaur"
                    />
                  </CommandEmpty>
                  <CommandGroup>
                    {projects &&
                      projects.map((project, idx) => (
                        <CommandItem
                          key={`${project.key}-${idx}`}
                          onSelect={() => {
                            setSelectedProject(project);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedProject &&
                                selectedProject.key === project.key
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          {project.key} ({(project.total / 60 / 60).toFixed(1)}{" "}
                          hrs)
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Hidden input to include in formData */}
          {/* {selectedProject && ( */}
          <input
            type="hidden"
            id="wakatime-project-name"
            name="wakatime_project_name"
            value={selectedProject?.key || ""}
          />
          {/* )} */}
        </div>

        <div className="pt-1"/>
        {gitSession ? (
          <div id="repo-field">
            <label htmlFor="repo_url">Repo URL</label>
            <input
              type="url"
              id="repo_url"
              name="repo_url"
              required
              className="w-full p-2 border rounded"
            />
          </div>
        ) : (
            <>
            <label className="">Sign in with GitHub
              <br />
              <span className="text-xs opacity-50">
              We need this to verify your ownership of the GitHub repo.
            </span>
            </label>
            <button className="p-2 px-3 flex items-center rounded bg-black text-white" onClick={() => signIn("github")}>
            <SiGithub className="mr-2" />
            Sign in with GitHub
            </button>
            </>
        )}

        <div id="readme-field">
          <label htmlFor="readme_url">README URL</label>
          <input
            type="url"
            id="readme_url"
            name="readme_url"
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <div id="deployment-field">
          <label htmlFor="deployment_url">
            Demo Link (Project / Video URL)
          </label>
          <input
            type="url"
            id="deployment_url"
            name="deployment_url"
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <div id="screenshot-field">
          <label htmlFor="screenshot_url">
            Screenshot URL
            <br />
            <span className="text-xs opacity-50">
              You can upload to{" "}
              <Link
                className="text-blue-500"
                href="https://hackclub.slack.com/archives/C016DEDUL87"
                target="_blank"
                rel="noopener noreferrer"
              >
                #cdn
              </Link>{" "}
              if you like!
            </span>
          </label>
          <input
            type="url"
            id="screenshot_url"
            name="screenshot_url"
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <Button type="submit" disabled={staging} id="new-ship-submit">
          {staging ? (
            <>
              <Icon glyph="more" />
              Staging!
            </>
          ) : (
            "Submit as a draft"
          )}
        </Button>
        <p className="text-xs opacity-50">
          Drafting a Ship means you can preview it before sending it off to be
          voted on!
        </p>
      </form>
    </div>
  );
}
