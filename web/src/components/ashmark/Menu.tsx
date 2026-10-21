import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { asset } from "@/game/assets";
import { SLOT_COUNT, describeSlot, type Settings, type SlotFile } from "@/game/saves";
import type { Campaign } from "@/game/types";

export function BootScreen({ src }: { src: string }) {
  return (
    <main className="boot" role="status" aria-live="polite" aria-label="Loading Ashmark">
      <img src={src} alt="" />
      <div className="boot-copy">
        <p className="kicker">The Pale Marches</p>
        <h1 className="display">Ashmark</h1>
        <p className="boot-wait">
          <span className="load-icon" aria-hidden />
          Loading
        </p>
      </div>
    </main>
  );
}

export function TitleMenu({ onEnter }: { onEnter: () => void }) {
  return (
    <section className="title-screen">
      <img className="title-map title-art" src={asset("/art/title.webp")} alt="" />
      <div className="title-copy">
        <p className="kicker">Dark fantasy tactical RPG</p>
        <h1 className="display display-xl">Ashmark</h1>
        <p className="lede">
          The Pale Marches bury banners faster than they raise them. Three sellswords, a debt, and no name worth
          speaking.
        </p>
        <button type="button" className="btn btn-gold" onClick={onEnter}>
          Enter
        </button>
        <InstallHint />
      </div>
    </section>
  );
}

function InstallHint() {
  const [prompt, setPrompt] = useState<Event & { prompt: () => Promise<void> } | null>(null);
  const [help, setHelp] = useState(false);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    if (standalone) setInstalled(true);
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as Event & { prompt: () => Promise<void> });
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);
  if (installed) return null;
  return (
    <div className="install-hint">
      <button
        type="button"
        className="text-btn"
        onClick={() => {
          if (!prompt) {
            setHelp(true);
            return;
          }
          void prompt.prompt().then(() => setPrompt(null));
        }}
      >
        Add to home screen
      </button>
      {help && (
        <p className="quiet">
          iPhone: Share, then Add to Home Screen. Android: the browser menu, then Install app. It opens with no site
          bar, held sideways.
        </p>
      )}
    </div>
  );
}

export function MainMenu({
  slots,
  settings,
  onSettings,
  onLoad,
  onCreate,
  onDelete,
  shelved,
  onRestore,
  onTitle,
}: {
  slots: (SlotFile | null)[];
  settings: Settings;
  onSettings: (next: Settings) => void;
  onLoad: (index: number) => void;
  onCreate: (index: number, name: string) => void;
  onDelete: (index: number) => void;
  shelved: Campaign[];
  onRestore: (name: string) => void;
  onTitle: () => void;
}) {
  const [panel, setPanel] = useState<"saves" | "settings">("saves");
  const [draft, setDraft] = useState("");
  const [naming, setNaming] = useState<number | null>(null);
  const [burn, setBurn] = useState<number | null>(null);
  const latest = slots.reduce<{ index: number; savedAt: number } | null>((best, file, index) => {
    if (!file) return best;
    if (!best || file.savedAt > best.savedAt) return { index, savedAt: file.savedAt };
    return best;
  }, null);

  return (
    <section className="title-screen">
      <img className="title-map" src={asset("/art/marches.jpg")} alt="" />
      <div className="title-copy">
        <p className="kicker">Main menu</p>
        <h1 className="display">Ashmark</h1>
        <div className="menu-switch">
          <button type="button" className={panel === "saves" ? "btn btn-gold" : "btn btn-ghost"} onClick={() => setPanel("saves")}>
            Save files
          </button>
          <button
            type="button"
            className={panel === "settings" ? "btn btn-gold" : "btn btn-ghost"}
            onClick={() => setPanel("settings")}
          >
            Settings
          </button>
          <button type="button" className="btn btn-ghost" onClick={onTitle}>
            Title
          </button>
        </div>

        {panel === "saves" ? (
          <>
            {latest && (
              <button type="button" className="btn btn-gold" onClick={() => onLoad(latest.index)}>
                Continue {describeSlot(slots[latest.index]!.campaign).title}
              </button>
            )}
            {shelved.length > 0 && (
              <ul className="slots">
                {shelved.map((campaign) => (
                  <li key={campaign.companyName} className="slot">
                    <div>
                      <p className="kicker">Still in the book</p>
                      <h2>{campaign.companyName}</h2>
                      <p className="quiet">{describeSlot(campaign).detail}</p>
                    </div>
                    <button type="button" className="btn btn-gold" onClick={() => onRestore(campaign.companyName)}>
                      Put them back
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <ul className="slots">
              {Array.from({ length: SLOT_COUNT }, (_, index) => {
                const file = slots[index] ?? null;
                const described = file ? describeSlot(file.campaign) : null;
                return (
                  <li key={index} className="slot">
                    <div>
                      <p className="kicker">File {index + 1}</p>
                      {described ? (
                        <>
                          <h2>{described.title}</h2>
                          <p className="quiet">{described.detail}</p>
                        </>
                      ) : (
                        <h2>Empty page</h2>
                      )}
                    </div>
                    {file ? (
                      <div className="contract-acts">
                        <button type="button" className="btn btn-gold" onClick={() => onLoad(index)}>
                          Load
                        </button>
                        <button
                          type="button"
                          className="btn btn-blood"
                          onClick={() => {
                            if (burn === index) onDelete(index);
                            setBurn(burn === index ? null : index);
                          }}
                        >
                          {burn === index ? "Burn it for certain" : "Burn this file"}
                        </button>
                      </div>
                    ) : naming === index ? (
                      <form
                        className="name-form"
                        onSubmit={(event) => {
                          event.preventDefault();
                          onCreate(index, draft);
                          setDraft("");
                        }}
                      >
                        <label htmlFor="company">Company name</label>
                        <input
                          id="company"
                          className="field"
                          maxLength={28}
                          placeholder="The Nameless"
                          value={draft}
                          onChange={(event) => setDraft(event.target.value)}
                          autoComplete="off"
                        />
                        <button type="submit" className="btn btn-gold">
                          Raise the company
                        </button>
                      </form>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => {
                          setNaming(index);
                          setDraft("");
                        }}
                      >
                        Raise a company
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <div className="settings">
            <button
              type="button"
              className="btn btn-ghost"
              aria-pressed={!settings.muted}
              onClick={() => onSettings({ ...settings, muted: !settings.muted })}
            >
              {settings.muted ? <VolumeX /> : <Volume2 />}
              Sound
              <small>{settings.muted ? "Off" : "On"}</small>
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              aria-pressed={settings.shake}
              onClick={() => onSettings({ ...settings, shake: !settings.shake })}
            >
              Screen shake
              <small>{settings.shake ? "On" : "Off"}</small>
            </button>
            <p className="quiet">These stay with this browser. They are not written into one company.</p>
          </div>
        )}
      </div>
    </section>
  );
}
