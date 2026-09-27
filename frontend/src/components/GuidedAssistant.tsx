import React, {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Maximize2,
  MessageSquare,
  RotateCcw,
  Send,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import robotLogo from "../assets/robot.png";
import { api } from "../services/api";

import {
  RegionalLanguage,
  useUISettings,
} from "../context/UISettingsContext";

/* ==========================================================================
   TYPES
========================================================================== */

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  time: Date;
}

type Copy = {
  welcome: string;
  status: string;
  placeholder: string;
  quick: string[];
  send: string;
  busy: string;
  local: string;
  connected: string;
  limited: string;
  clear: string;
  online: string;
  resize: string;
};

interface PanelSize {
  width: number;
  height: number;
}

/* ==========================================================================
   COPY
========================================================================== */

const copyByLanguage: Partial<
  Record<RegionalLanguage, Copy>
> = {
  English: {
    welcome:
      "I'm Zia, GeoVISTA's AI assistant. Ask me about GeoVISTA, 3D ULPIN, vertical property mapping, buildings, floors, datasets, validation, or the prototype workflow. I can guide you through the project. ✨",

    status: "GeoVISTA AI · multilingual",

    placeholder:
      "Ask Zia about GeoVISTA…",

    quick: [
      "What is 3D ULPIN?",
      "How are floors derived?",
      "How does validation work?",
      "What data does GeoVISTA use?",
    ],

    send: "Send",
    busy: "Zia is thinking…",

    local:
      "Local guide · AI temporarily unavailable",

    connected:
      "AI online · project-scoped",

    limited:
      "AI limit reached · local guide active",

    clear: "Clear chat",
    online: "Online",
    resize: "Resize assistant",
  },

  "हिन्दी": {
    welcome:
      "मैं Zia हूँ, GeoVISTA का AI सहायक। GeoVISTA, 3D ULPIN, vertical property mapping, buildings, floors, datasets और validation के बारे में पूछें। मैं project समझाने में मदद कर सकता हूँ, लेकिन ownership verify या official ULPIN जारी नहीं कर सकता। ✨",

    status: "GeoVISTA AI · बहुभाषी",

    placeholder:
      "Zia से GeoVISTA के बारे में पूछें…",

    quick: [
      "3D ULPIN क्या है?",
      "मंज़िलें कैसे निकाली जाती हैं?",
      "Validation कैसे होती है?",
      "GeoVISTA कौन-सा डेटा उपयोग करता है?",
    ],

    send: "भेजें",
    busy: "Zia सोच रहा है…",

    local:
      "स्थानीय सहायता · AI अस्थायी रूप से उपलब्ध नहीं",

    connected:
      "AI ऑनलाइन · project तक सीमित",

    limited:
      "AI सीमा पूरी · स्थानीय सहायता सक्रिय",

    clear: "चैट साफ़ करें",
    online: "ऑनलाइन",
    resize: "Assistant का size बदलें",
  },

  "मराठी": {
    welcome:
      "मी Zia आहे, GeoVISTA चा AI सहाय्यक. GeoVISTA, 3D ULPIN, vertical property mapping, buildings, floors, datasets आणि validation बद्दल विचारा. मी project समजावून सांगू शकतो, पण ownership verify किंवा official ULPIN जारी करू शकत नाही. ✨",

    status: "GeoVISTA AI · बहुभाषी",

    placeholder:
      "Zia ला GeoVISTA बद्दल विचारा…",

    quick: [
      "3D ULPIN म्हणजे काय?",
      "मजले कसे तयार होतात?",
      "Validation कशी होते?",
      "GeoVISTA कोणता डेटा वापरतो?",
    ],

    send: "पाठवा",
    busy: "Zia विचार करत आहे…",

    local:
      "स्थानिक सहाय्य · AI तात्पुरते उपलब्ध नाही",

    connected:
      "AI ऑनलाइन · प्रकल्पापुरते",

    limited:
      "AI मर्यादा पूर्ण · स्थानिक सहाय्य सक्रिय",

    clear: "चॅट साफ करा",
    online: "ऑनलाइन",
    resize: "Assistant चा size बदला",
  },
};

const defaultCopy: Copy =
  copyByLanguage.English!;

/* ==========================================================================
   GREETING
========================================================================== */

function getGreeting(
  name: string,
  language: RegionalLanguage,
): string {
  const safeName = name.trim() || "there";

  if (language === "हिन्दी") {
    return `नमस्ते ${safeName}! 👋`;
  }

  if (language === "मराठी") {
    return `नमस्कार ${safeName}! 👋`;
  }

  return `Hello ${safeName}! 👋`;
}

/* ==========================================================================
   HINGLISH DETECTION
========================================================================== */

function isLikelyHinglish(
  text: string,
): boolean {
  const value = text
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ");

  const hinglishTerms = [
    "kya",
    "kaise",
    "kaisa",
    "haal",
    "hai",
    "hain",
    "h",
    "mujhe",
    "mujko",
    "batao",
    "btao",
    "bata",
    "kr",
    "karo",
    "karna",
    "karta",
    "karte",
    "kaise",
    "kyu",
    "kyon",
    "kyunki",
    "acha",
    "achha",
    "accha",
    "theek",
    "thik",
    "bhai",
    "yaar",
    "mera",
    "meri",
    "mere",
    "aap",
    "tum",
    "tumhara",
    "apka",
    "iska",
    "uska",
    "nahi",
    "nahin",
    "ni",
    "haan",
    "ha",
    "wala",
    "wali",
    "wale",
    "mein",
    "me",
    "mujhe",
    "chahiye",
    "kuch",
    "kuchh",
    "kaam",
    "krta",
    "krti",
    "kar",
    "krega",
    "karenge",
    "samjhao",
    "samjha",
    "samajh",
    "dikhao",
    "lagao",
    "rakhna",
    "hoga",
    "hogi",
    "hogaa",
    "bnao",
    "banao",
  ];

  const matches = hinglishTerms.filter(
    (term) =>
      value.split(/\s+/).includes(term),
  ).length;

  return matches >= 2;
}

/* ==========================================================================
   LOCAL FALLBACK
========================================================================== */

function localAnswer(
  prompt: string,
  language: RegionalLanguage,
): string {
  const normalized =
    prompt.toLocaleLowerCase();

  const hinglish =
    isLikelyHinglish(prompt);

  const hindi = language === "हिन्दी";
  const marathi =
    language === "मराठी";

  const contains = (...terms: string[]) =>
    terms.some((term) =>
      normalized.includes(term),
    );

  if (
    contains(
      "hello",
      "hi",
      "hey",
      "hii",
      "namaste",
      "नमस्ते",
      "नमस्कार",
    )
  ) {
    if (hinglish) {
      return "Hey bhai! 👋 Main Zia hoon. GeoVISTA, 3D ULPIN, buildings, floors, validation ya dataset ke baare mein kuch bhi pooch sakte ho. ✨";
    }

    if (hindi) {
      return "नमस्ते! 👋 मैं Zia हूँ। GeoVISTA, 3D ULPIN, buildings, floors, validation या datasets के बारे में पूछ सकते हैं। ✨";
    }

    if (marathi) {
      return "नमस्कार! 👋 मी Zia आहे. GeoVISTA, 3D ULPIN, buildings, floors, validation किंवा datasets बद्दल विचारा. ✨";
    }

    return "Hey! 👋 I'm Zia. Ask me anything about GeoVISTA, 3D ULPIN, buildings, floors, validation, or datasets. ✨";
  }

  if (
    contains(
      "3d ulpin",
      "3d id",
      "identifier",
      "identity",
      "पहचान",
      "ओळख",
    )
  ) {
    if (hinglish) {
      return "GeoVISTA ka 3D ULPIN concept parcel identity, building identity, vertical level, Z-range aur spatial reference ko combine karta hai. Prototype me dikhaya gaya ID demo identifier hai — official government ULPIN nahi. 🗺️";
    }

    if (hindi) {
      return "GeoVISTA का 3D ULPIN concept parcel identity, building identity, vertical level, Z-range और spatial reference को जोड़ता है। Prototype में दिखाया गया ID demo identifier है, official government ULPIN नहीं। 🗺️";
    }

    if (marathi) {
      return "GeoVISTA चा 3D ULPIN concept parcel identity, building identity, vertical level, Z-range आणि spatial reference जोडतो. Prototype मधील ID हा demo identifier आहे, अधिकृत सरकारी ULPIN नाही. 🗺️";
    }

    return "GeoVISTA's 3D ULPIN concept combines parcel identity, building identity, vertical level, Z range, and spatial reference. Any ID shown by the prototype is a demo identifier, not an official government ULPIN. 🗺️";
  }

  if (
    contains(
      "floor",
      "level",
      "storey",
      "मंज़िल",
      "मजला",
      "तल",
    )
  ) {
    if (hinglish) {
      return "Jahan source floor plans available nahi hain, prototype available building height aur floor attributes se equal-height floor bands derive kar sakta hai. Ye surveyed ownership units nahi maane jaane chahiye. 🏢";
    }

    if (hindi) {
      return "जहाँ source floor plans उपलब्ध नहीं हैं, prototype available building height और floor attributes से equal-height floor bands derive कर सकता है। इन्हें surveyed ownership units नहीं माना जाना चाहिए. 🏢";
    }

    return "Where source floor plans are unavailable, the prototype can derive equal-height floor bands from available building height and floor attributes. These should not be treated as surveyed ownership units. 🏢";
  }

  if (
    contains(
      "valid",
      "validation",
      "topology",
      "check",
      "जाँच",
      "सत्यापन",
      "तपासणी",
    )
  ) {
    if (hinglish) {
      return "Prototype geometry, parcel/building linkage, height, Z-range, floor consistency aur generated 3D volume ki technical checks karta hai. Ye legal ya official cadastral validation nahi hai. ✅";
    }

    if (hindi) {
      return "Prototype geometry, parcel/building linkage, height, Z-range, floor consistency और generated 3D volume की technical checks करता है। यह legal या official cadastral validation नहीं है. ✅";
    }

    return "Prototype validation checks geometry, parcel/building linkage, height, Z range, floor consistency, and generated 3D volume. These are technical checks, not official or legal cadastral validation. ✅";
  }

  if (
    contains(
      "source",
      "data",
      "dataset",
      "डेटा",
      "स्रोत",
    )
  ) {
    if (hinglish) {
      return "Bhopal mode GeoVISTA building GeoJSON use karta hai. NYC reference mode public building-footprint aur MapPLUTO samples use karta hai. Reference data ko official cadastre nahi maana jaana chahiye. 📊";
    }

    if (hindi) {
      return "Bhopal mode GeoVISTA building GeoJSON का उपयोग करता है। NYC reference mode public building-footprint और MapPLUTO samples का उपयोग करता है। Reference data को official cadastre नहीं माना जाना चाहिए. 📊";
    }

    return "Bhopal mode uses the GeoVISTA building GeoJSON. NYC reference mode uses public building-footprint and MapPLUTO samples. Reference data should not be treated as an official cadastre. 📊";
  }

  if (
    contains(
      "ownership",
      "owner",
      "legal",
      "मालिक",
      "स्वामित्व",
    )
  ) {
    if (hinglish) {
      return "Ye prototype ownership, title ya legal rights determine nahi karta. Ye source-labelled geometry aur technical workflow ko visualize karta hai. 🔎";
    }

    return "This prototype does not determine ownership, title, or legal rights. It displays source-labelled geometry and a technical workflow. 🔎";
  }

  if (hinglish) {
    return "GeoVISTA parcel context ko buildings, vertical levels, elevation, conceptual underground layers aur prototype validation ke saath 3D cadastral workflow me combine karta hai. 🌐";
  }

  if (hindi) {
    return "GeoVISTA parcel context को buildings, vertical levels, elevation, conceptual underground layers और prototype validation के साथ 3D cadastral workflow में जोड़ता है. 🌐";
  }

  if (marathi) {
    return "GeoVISTA parcel context ला buildings, vertical levels, elevation, conceptual underground layers आणि prototype validation सोबत 3D cadastral workflow मध्ये जोडतो. 🌐";
  }

  return "GeoVISTA combines parcel context with buildings, vertical levels, elevation, conceptual underground layers, and prototype validation in a 3D cadastral workflow. 🌐";
}

/* ==========================================================================
   USER AVATAR
   Put your downloaded avatar at:
   public/user-avatar.png
========================================================================== */

const UserAvatar: React.FC = () => {
  const [failed, setFailed] =
    useState(false);

  if (failed) {
    return (
      <div
        className="
          flex h-7 w-7 shrink-0
          items-center justify-center
          rounded-full
          border border-white/60
          bg-gradient-to-br
          from-slate-200
          to-slate-300
          text-slate-600
          shadow-sm
          dark:border-slate-700
          dark:from-slate-700
          dark:to-slate-800
          dark:text-slate-300
        "
      >
        <UserRound className="h-3.5 w-3.5" />
      </div>
    );
  }

  return (
    <div
      className="
        h-7 w-7 shrink-0 overflow-hidden
        rounded-full
        border border-white/70
        bg-slate-200
        shadow-sm
        dark:border-slate-700
      "
    >
      <img
        src="/user-avatar.png"
        alt="You"
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
};

/* ==========================================================================
   COMPONENT
========================================================================== */

export const GuidedAssistant: React.FC =
  () => {
    const { language } =
      useUISettings();

    const copy =
      copyByLanguage[language] ??
      defaultCopy;

    const currentUser =
      api.getCurrentUser();

    const userName =
      currentUser?.name?.trim() ||
      "there";

    const initialMessage = (): Message => ({
      id: crypto.randomUUID(),
      sender: "bot",
      text: `${getGreeting(
        userName,
        language,
      )}\n\n${copy.welcome}`,
      time: new Date(),
    });

    /* ----------------------------------------------------------------------
       STATE
    ---------------------------------------------------------------------- */

    const [isOpen, setIsOpen] =
      useState(false);

    const [messages, setMessages] =
      useState<Message[]>([
        initialMessage(),
      ]);

    const [input, setInput] =
      useState("");

    const [pending, setPending] =
      useState(false);

    const [llmConfigured, setLlmConfigured] =
      useState<boolean | null>(null);

    const [rateLimited, setRateLimited] =
      useState(false);

    const [panelSize, setPanelSize] =
      useState<PanelSize>({
        width: 350,
        height: 500,
      });

    const scrollRef =
      useRef<HTMLDivElement>(null);

    const inputRef =
      useRef<HTMLInputElement>(null);

    const assistantRef =
      useRef<HTMLDivElement>(null);

    const resizeRef =
      useRef<{
        active: boolean;
        startX: number;
        startY: number;
        startWidth: number;
        startHeight: number;
      } | null>(null);

    /* ----------------------------------------------------------------------
       STATUS
    ---------------------------------------------------------------------- */

    const status = useMemo(() => {
      if (rateLimited) {
        return copy.limited;
      }

      if (llmConfigured === true) {
        return copy.connected;
      }

      if (llmConfigured === false) {
        return copy.local;
      }

      return copy.status;
    }, [
      copy,
      llmConfigured,
      rateLimited,
    ]);

    /* ----------------------------------------------------------------------
       LANGUAGE UPDATE
    ---------------------------------------------------------------------- */

    useEffect(() => {
      setMessages((previous) => {
        if (
          previous.length === 1 &&
          previous[0].sender === "bot"
        ) {
          return [initialMessage()];
        }

        return previous;
      });
    }, [
      language,
      copy.welcome,
      userName,
    ]);

    /* ----------------------------------------------------------------------
       OUTSIDE CLICK
    ---------------------------------------------------------------------- */

    useEffect(() => {
      if (!isOpen) {
        return;
      }

      const handlePointerDown = (
        event: PointerEvent,
      ) => {
        const target =
          event.target as Node | null;

        if (
          target &&
          !assistantRef.current?.contains(
            target,
          )
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener(
        "pointerdown",
        handlePointerDown,
      );

      return () => {
        document.removeEventListener(
          "pointerdown",
          handlePointerDown,
        );
      };
    }, [isOpen]);

    /* ----------------------------------------------------------------------
       AUTO SCROLL
    ---------------------------------------------------------------------- */

    useEffect(() => {
      const element =
        scrollRef.current;

      if (!element) {
        return;
      }

      requestAnimationFrame(() => {
        element.scrollTo({
          top: element.scrollHeight,
          behavior: "smooth",
        });
      });
    }, [
      messages,
      pending,
    ]);

    /* ----------------------------------------------------------------------
       FOCUS
    ---------------------------------------------------------------------- */

    useEffect(() => {
      if (!isOpen) {
        return;
      }

      const timer =
        window.setTimeout(() => {
          inputRef.current?.focus();
        }, 180);

      return () =>
        window.clearTimeout(timer);
    }, [isOpen]);

    /* ----------------------------------------------------------------------
       RESIZE
    ---------------------------------------------------------------------- */

    const startResize = (
      event: React.PointerEvent<HTMLButtonElement>,
    ) => {
      event.preventDefault();
      event.stopPropagation();

      resizeRef.current = {
        active: true,
        startX: event.clientX,
        startY: event.clientY,
        startWidth: panelSize.width,
        startHeight: panelSize.height,
      };

      event.currentTarget.setPointerCapture(
        event.pointerId,
      );
    };

    const handleResize = (
      event: React.PointerEvent<HTMLButtonElement>,
    ) => {
      const resize =
        resizeRef.current;

      if (!resize?.active) {
        return;
      }

      const minWidth = 320;
      const maxWidth = Math.min(
        560,
        window.innerWidth - 16,
      );

      const minHeight = 440;
      const maxHeight = Math.min(
        760,
        window.innerHeight - 24,
      );

      const nextWidth = Math.min(
        maxWidth,
        Math.max(
          minWidth,
          resize.startWidth +
            (resize.startX -
              event.clientX),
        ),
      );

      const nextHeight = Math.min(
        maxHeight,
        Math.max(
          minHeight,
          resize.startHeight +
            (resize.startY -
              event.clientY),
        ),
      );

      setPanelSize({
        width: nextWidth,
        height: nextHeight,
      });
    };

    const stopResize = () => {
      resizeRef.current = null;
    };

    /* ----------------------------------------------------------------------
       SEND
    ---------------------------------------------------------------------- */

    const sendPrompt = useCallback(
      async (text: string) => {
        const question = text
          .trim()
          .slice(0, 1200);

        if (!question || pending) {
          return;
        }

        setInput("");
        setPending(true);
        setRateLimited(false);

        const userMessage: Message = {
          id: crypto.randomUUID(),
          sender: "user",
          text: question,
          time: new Date(),
        };

        setMessages((previous) => [
          ...previous,
          userMessage,
        ]);

        try {
          const history = [
            ...messages,
            userMessage,
          ]
            .slice(-8)
            .map((message) => ({
              role:
                message.sender === "user"
                  ? ("user" as const)
                  : ("assistant" as const),
              content: message.text,
            }));

          /*
           * Keep the selected UI language,
           * but explicitly tell backend when
           * the user is speaking Hinglish.
           */
          const requestLanguage =
            isLikelyHinglish(question)
              ? "Hinglish"
              : language;

          const result =
            await api.chatWithAssistant(
              question,
              requestLanguage,
              history,
            );

          setLlmConfigured(
            Boolean(
              result.providerConfigured,
            ),
          );

          if (result.rateLimited) {
            setRateLimited(true);

            setMessages(
              (previous) => [
                ...previous,
                {
                  id: crypto.randomUUID(),
                  sender: "bot",
                  text: localAnswer(
                    question,
                    language,
                  ),
                  time: new Date(),
                },
              ],
            );

            return;
          }

          const reply =
            result.reply?.trim() ||
            localAnswer(
              question,
              language,
            );

          setMessages(
            (previous) => [
              ...previous,
              {
                id: crypto.randomUUID(),
                sender: "bot",
                text: reply,
                time: new Date(),
              },
            ],
          );
        } catch {
          setLlmConfigured(false);

          setMessages(
            (previous) => [
              ...previous,
              {
                id: crypto.randomUUID(),
                sender: "bot",
                text: localAnswer(
                  question,
                  language,
                ),
                time: new Date(),
              },
            ],
          );
        } finally {
          setPending(false);
        }
      },
      [
        language,
        messages,
        pending,
      ],
    );

    /* ----------------------------------------------------------------------
       SUBMIT
    ---------------------------------------------------------------------- */

    const submit = (
      event: FormEvent,
    ) => {
      event.preventDefault();
      void sendPrompt(input);
    };

    /* ----------------------------------------------------------------------
       CLEAR
    ---------------------------------------------------------------------- */

    const clearChat = () => {
      setMessages([
        initialMessage(),
      ]);

      setRateLimited(false);
    };

    /* ----------------------------------------------------------------------
       TIME
    ---------------------------------------------------------------------- */

    const formatTime = (
      date: Date,
    ) =>
      date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

    /* ----------------------------------------------------------------------
       MARKDOWN
    ---------------------------------------------------------------------- */

    const markdownComponents = {
      h1: ({
        children,
      }: any) => (
        <h1 className="mb-2 mt-1 text-sm font-bold text-slate-950 dark:text-white">
          {children}
        </h1>
      ),

      h2: ({
        children,
      }: any) => (
        <h2 className="mb-2 mt-3 text-sm font-bold text-slate-950 dark:text-white">
          {children}
        </h2>
      ),

      h3: ({
        children,
      }: any) => (
        <h3 className="mb-1.5 mt-2 text-xs font-bold text-blue-900 dark:text-blue-300">
          {children}
        </h3>
      ),

      p: ({
        children,
      }: any) => (
        <p className="mb-2 last:mb-0 leading-[1.55]">
          {children}
        </p>
      ),

      strong: ({
        children,
      }: any) => (
        <strong className="font-bold text-slate-950 dark:text-white">
          {children}
        </strong>
      ),

      ul: ({
        children,
      }: any) => (
        <ul className="mb-2 ml-4 list-disc space-y-1">
          {children}
        </ul>
      ),

      ol: ({
        children,
      }: any) => (
        <ol className="mb-2 ml-4 list-decimal space-y-1">
          {children}
        </ol>
      ),

      li: ({
        children,
      }: any) => (
        <li className="pl-1 leading-5">
          {children}
        </li>
      ),

      blockquote: ({
        children,
      }: any) => (
        <blockquote className="my-2 rounded-r-xl border-l-2 border-blue-500 bg-blue-50/70 px-3 py-2 text-slate-700 dark:bg-blue-950/30 dark:text-slate-300">
          {children}
        </blockquote>
      ),

      code: ({
        children,
      }: any) => (
        <code className="rounded-md bg-slate-100 px-1 py-0.5 font-mono text-[10px] text-blue-900 dark:bg-slate-800 dark:text-blue-300">
          {children}
        </code>
      ),

      table: ({
        children,
      }: any) => (
        <div className="my-2 w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full min-w-[320px] border-collapse text-[10px]">
            {children}
          </table>
        </div>
      ),

      thead: ({
        children,
      }: any) => (
        <thead className="bg-blue-50 dark:bg-blue-950/40">
          {children}
        </thead>
      ),

      tbody: ({
        children,
      }: any) => (
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {children}
        </tbody>
      ),

      tr: ({
        children,
      }: any) => (
        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
          {children}
        </tr>
      ),

      th: ({
        children,
      }: any) => (
        <th className="border-b border-slate-200 px-2 py-1.5 text-left font-bold text-blue-950 dark:border-slate-700 dark:text-blue-300">
          {children}
        </th>
      ),

      td: ({
        children,
      }: any) => (
        <td className="px-2 py-1.5 align-top text-slate-700 dark:text-slate-300">
          {children}
        </td>
      ),

      hr: () => (
        <hr className="my-2 border-slate-200 dark:border-slate-700" />
      ),
    };

    /* ----------------------------------------------------------------------
       UI
    ---------------------------------------------------------------------- */

    return (
      <>
        <style>
          {`
            @keyframes ziaFloat {
              0%,100% {
                transform: translateY(0);
              }
              50% {
                transform: translateY(-3px);
              }
            }

            @keyframes ziaPulse {
              0% {
                transform: scale(.88);
                opacity: .45;
              }
              70% {
                transform: scale(1.35);
                opacity: 0;
              }
              100% {
                opacity: 0;
              }
            }

            @keyframes ziaIn {
              from {
                opacity: 0;
                transform:
                  translateY(14px)
                  scale(.97);
              }
              to {
                opacity: 1;
                transform:
                  translateY(0)
                  scale(1);
              }
            }

            @keyframes ziaMessage {
              from {
                opacity: 0;
                transform:
                  translateY(6px)
                  scale(.985);
              }
              to {
                opacity: 1;
                transform:
                  translateY(0)
                  scale(1);
              }
            }

            @keyframes ziaTyping {
              0%,60%,100% {
                transform: translateY(0);
                opacity: .3;
              }
              30% {
                transform: translateY(-3px);
                opacity: 1;
              }
            }

            @keyframes ziaShimmer {
              0% {
                transform: translateX(-120%);
              }
              100% {
                transform: translateX(120%);
              }
            }

            .zia-float {
              animation:
                ziaFloat 3.2s ease-in-out infinite;
            }

            .zia-pulse {
              animation:
                ziaPulse 2.2s ease-out infinite;
            }

            .zia-panel-in {
              animation:
                ziaIn 240ms cubic-bezier(.2,.8,.2,1)
                both;
            }

            .zia-message {
              animation:
                ziaMessage 180ms ease-out both;
            }

            .zia-dot {
              animation:
                ziaTyping 1.2s ease-in-out infinite;
            }

            .zia-dot:nth-child(2) {
              animation-delay: 150ms;
            }

            .zia-dot:nth-child(3) {
              animation-delay: 300ms;
            }

            .zia-scrollbar::-webkit-scrollbar {
              width: 4px;
            }

            .zia-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }

            .zia-scrollbar::-webkit-scrollbar-thumb {
              background: rgba(100,116,139,.25);
              border-radius: 999px;
            }

            @media (prefers-reduced-motion: reduce) {
              .zia-float,
              .zia-pulse,
              .zia-panel-in,
              .zia-message,
              .zia-dot {
                animation: none !important;
              }
            }
          `}
        </style>

        {/* ==================================================================
            ASSISTANT ROOT
        ================================================================== */}

        <div
          ref={assistantRef}
          className="
            fixed
            bottom-3
            right-3
            z-[70]
            sm:bottom-5
            sm:right-5
          "
        >
          {isOpen ? (
            <section
              className="
                zia-panel-in
                relative
                flex
                flex-col
                overflow-hidden
                rounded-[22px]
                border
                border-white/70
                bg-white/88
                shadow-[0_22px_70px_rgba(15,23,42,.22)]
                ring-1
                ring-slate-900/[0.04]
                backdrop-blur-2xl

                dark:border-slate-700/70
                dark:bg-slate-950/82
                dark:shadow-[0_24px_80px_rgba(0,0,0,.45)]

                max-sm:!h-[min(72dvh,500px)]
                max-sm:!w-[calc(100vw-16px)]
              "
              style={{
                width: `min(${panelSize.width}px, calc(100vw - 16px))`,
                height: `min(${panelSize.height}px, calc(100dvh - 24px))`,
              }}
              aria-label="Zia AI Assistant"
            >
              {/* ==========================================================
                  RESIZE HANDLE — TOP LEFT
              ========================================================== */}

              <button
                type="button"
                title={copy.resize}
                aria-label={copy.resize}
                onPointerDown={
                  startResize
                }
                onPointerMove={
                  handleResize
                }
                onPointerUp={
                  stopResize
                }
                onPointerCancel={
                  stopResize
                }
                className="
                  group
                  absolute
                  left-0
                  top-0
                  z-30
                  flex
                  h-9
                  w-9
                  cursor-nwse-resize
                  items-start
                  justify-start
                  rounded-tl-[22px]
                  p-2
                "
              >
                <span
                  className="
                    h-3
                    w-3
                    border-l-2
                    border-t-2
                    border-blue-500/50
                    transition
                    group-hover:border-blue-500
                    group-hover:scale-110
                  "
                />
              </button>

              {/* ==========================================================
                  HEADER
              ========================================================== */}

              <header
                className="
                  relative
                  shrink-0
                  overflow-hidden
                  border-b
                  border-white/50
                  bg-white/70
                  px-3.5
                  py-2.5
                  backdrop-blur-xl

                  dark:border-slate-700/60
                  dark:bg-slate-900/70
                "
              >
                <div
                  className="
                    pointer-events-none
                    absolute
                    -right-10
                    -top-14
                    h-32
                    w-32
                    rounded-full
                    bg-blue-500/10
                    blur-3xl
                  "
                />

                <div
                  className="
                    pointer-events-none
                    absolute
                    bottom-0
                    left-20
                    h-16
                    w-32
                    rounded-full
                    bg-indigo-500/10
                    blur-2xl
                  "
                />

                <div className="relative flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    {/* ZIA AVATAR */}

                    <div className="relative shrink-0">
                      <span
                        className="
                          zia-pulse
                          absolute
                          inset-0
                          rounded-xl
                          bg-blue-500/20
                        "
                      />

                      <div
                        className="
                          zia-float
                          relative
                          flex
                          h-10
                          w-10
                          items-center
                          justify-center
                          overflow-hidden
                          rounded-xl
                          border
                          border-white/80
                          bg-blue-950
                          shadow-lg
                          shadow-blue-900/15
                          dark:border-slate-600
                        "
                      >
                        <img
                          src={robotLogo}
                          alt="Zia"
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <span
                        className="
                          absolute
                          bottom-[-1px]
                          right-[-1px]
                          h-2.5
                          w-2.5
                          rounded-full
                          border-2
                          border-white
                          bg-emerald-400
                          shadow-[0_0_8px_rgba(52,211,153,.7)]
                          dark:border-slate-900
                        "
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h2 className="text-[13px] font-bold tracking-tight text-slate-900 dark:text-white">
                          Zia
                        </h2>

                        <span
                          className="
                            inline-flex
                            items-center
                            gap-1
                            rounded-full
                            border
                            border-blue-200/80
                            bg-blue-50/80
                            px-1.5
                            py-0.5
                            text-[7px]
                            font-bold
                            text-blue-700
                            dark:border-blue-800
                            dark:bg-blue-950/60
                            dark:text-blue-300
                          "
                        >
                          <Sparkles className="h-2.5 w-2.5" />
                          AI
                        </span>
                      </div>

                      <p className="mt-0.5 truncate text-[9px] font-medium text-slate-500 dark:text-slate-400">
                        {status}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={clearChat}
                      title={copy.clear}
                      aria-label={copy.clear}
                      className="
                        rounded-lg
                        p-1.5
                        text-slate-400
                        transition
                        hover:bg-slate-100
                        hover:text-blue-600
                        dark:hover:bg-slate-800
                        dark:hover:text-blue-300
                      "
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setIsOpen(false)
                      }
                      aria-label="Close Zia"
                      className="
                        rounded-lg
                        p-1.5
                        text-slate-400
                        transition
                        hover:bg-slate-100
                        hover:text-slate-900
                        dark:hover:bg-slate-800
                        dark:hover:text-white
                      "
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="relative mt-1.5 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_7px_rgba(52,211,153,.8)]" />

                  <span className="text-[8px] font-medium text-slate-500 dark:text-slate-400">
                    {copy.online}
                  </span>

                  <span className="ml-auto text-[7px] font-medium text-slate-400 dark:text-slate-500">
                    GeoVISTA
                  </span>
                </div>
              </header>

              {/* ==========================================================
                  CHAT
              ========================================================== */}

              <div
                ref={scrollRef}
                className="
                  zia-scrollbar
                  min-h-0
                  flex-1
                  space-y-2.5
                  overflow-y-auto
                  bg-gradient-to-b
                  from-slate-50/65
                  via-white/50
                  to-white/70
                  px-3
                  py-3

                  dark:from-slate-950/60
                  dark:via-slate-950/45
                  dark:to-slate-900/60
                "
              >
                {messages.map(
                  (message) => {
                    const isUser =
                      message.sender ===
                      "user";

                    return (
                      <div
                        key={message.id}
                        className={`
                          zia-message
                          flex
                          items-end
                          gap-1.5
                          ${
                            isUser
                              ? "justify-end"
                              : "justify-start"
                          }
                        `}
                      >
                        {!isUser && (
                          <div
                            className="
                              mb-0.5
                              flex
                              h-7
                              w-7
                              shrink-0
                              items-center
                              justify-center
                              overflow-hidden
                              rounded-full
                              border
                              border-white
                              bg-blue-950
                              shadow-sm
                              dark:border-slate-700
                            "
                          >
                            <img
                              src={robotLogo}
                              alt="Zia"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}

                        <div
                          className={`
                            max-w-[84%]
                            rounded-[17px]
                            px-3
                            py-2.5
                            text-[11px]
                            leading-relaxed
                            shadow-sm
                            ${
                              isUser
                                ? `
                                  rounded-br-md
                                  bg-gradient-to-br
                                  from-blue-600
                                  to-indigo-600
                                  text-white
                                  shadow-blue-600/15
                                `
                                : `
                                  rounded-bl-md
                                  border
                                  border-slate-200/80
                                  bg-white/75
                                  text-slate-700
                                  backdrop-blur-md
                                  dark:border-slate-700/70
                                  dark:bg-slate-900/65
                                  dark:text-slate-300
                                `
                            }
                          `}
                        >
                          <ReactMarkdown
                            remarkPlugins={[
                              remarkGfm,
                            ]}
                            components={
                              markdownComponents
                            }
                          >
                            {message.text}
                          </ReactMarkdown>

                          <div
                            className={`
                              mt-1
                              text-[7px]
                              ${
                                isUser
                                  ? "text-blue-100/70"
                                  : "text-slate-400 dark:text-slate-500"
                              }
                            `}
                          >
                            {formatTime(
                              message.time,
                            )}
                          </div>
                        </div>

                        {isUser && (
                          <UserAvatar />
                        )}
                      </div>
                    );
                  },
                )}

                {pending && (
                  <div className="zia-message flex items-end gap-1.5">
                    <div
                      className="
                        flex
                        h-7
                        w-7
                        shrink-0
                        items-center
                        justify-center
                        overflow-hidden
                        rounded-full
                        border
                        border-white
                        bg-blue-950
                        shadow-sm
                        dark:border-slate-700
                      "
                    >
                      <img
                        src={robotLogo}
                        alt="Zia"
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div
                      className="
                        flex
                        items-center
                        gap-1
                        rounded-2xl
                        rounded-bl-md
                        border
                        border-slate-200/80
                        bg-white/80
                        px-3
                        py-2.5
                        shadow-sm
                        dark:border-slate-700
                        dark:bg-slate-900/70
                      "
                    >
                      <span className="zia-dot h-1.5 w-1.5 rounded-full bg-blue-500" />
                      <span className="zia-dot h-1.5 w-1.5 rounded-full bg-blue-500" />
                      <span className="zia-dot h-1.5 w-1.5 rounded-full bg-blue-500" />

                      <span className="ml-1 text-[8px] text-slate-400">
                        {copy.busy}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* ==========================================================
                  QUICK QUESTIONS
              ========================================================== */}

              <div
                className="
                  shrink-0
                  border-t
                  border-slate-200/70
                  bg-white/70
                  px-3
                  py-2
                  backdrop-blur-xl
                  dark:border-slate-700/60
                  dark:bg-slate-900/65
                "
              >
                <div className="mb-1.5 flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5 text-blue-500" />

                  <span className="text-[7px] font-bold uppercase tracking-[.14em] text-slate-400 dark:text-slate-500">
                    Quick questions
                  </span>
                </div>

                <div
                  className="
                    flex
                    gap-1.5
                    overflow-x-auto
                    pb-0.5
                    [scrollbar-width:none]
                  "
                >
                  {copy.quick.map(
                    (prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          void sendPrompt(
                            prompt,
                          )
                        }
                        className="
                          shrink-0
                          rounded-full
                          border
                          border-slate-200
                          bg-slate-50/80
                          px-2.5
                          py-1.5
                          text-[8px]
                          font-semibold
                          text-slate-600
                          transition
                          hover:-translate-y-0.5
                          hover:border-blue-300
                          hover:bg-blue-50
                          hover:text-blue-700
                          disabled:opacity-40

                          dark:border-slate-700
                          dark:bg-slate-800/70
                          dark:text-slate-300
                          dark:hover:border-blue-700
                          dark:hover:bg-blue-950/60
                          dark:hover:text-blue-300
                        "
                      >
                        {prompt}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* ==========================================================
                  INPUT
              ========================================================== */}

              <form
                onSubmit={submit}
                className="
                  shrink-0
                  border-t
                  border-slate-200/70
                  bg-white/80
                  p-2.5
                  backdrop-blur-xl
                  dark:border-slate-700/60
                  dark:bg-slate-900/70
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-1.5
                    rounded-[15px]
                    border
                    border-slate-200
                    bg-slate-50/80
                    p-1
                    transition
                    focus-within:border-blue-400
                    focus-within:bg-white
                    focus-within:ring-2
                    focus-within:ring-blue-500/10

                    dark:border-slate-700
                    dark:bg-slate-800/70
                    dark:focus-within:border-blue-600
                    dark:focus-within:bg-slate-800
                  "
                >
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(event) =>
                      setInput(
                        event.target.value,
                      )
                    }
                    maxLength={1200}
                    placeholder={
                      copy.placeholder
                    }
                    aria-label={
                      copy.placeholder
                    }
                    className="
                      min-w-0
                      flex-1
                      bg-transparent
                      px-2
                      py-1.5
                      text-[10px]
                      text-slate-900
                      outline-none
                      placeholder:text-slate-400
                      dark:text-white
                      dark:placeholder:text-slate-500
                    "
                  />

                  <button
                    type="submit"
                    disabled={
                      !input.trim() ||
                      pending
                    }
                    aria-label={
                      copy.send
                    }
                    className="
                      flex
                      h-8
                      w-8
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-gradient-to-br
                      from-blue-600
                      to-indigo-700
                      text-white
                      shadow-md
                      shadow-blue-700/20
                      transition
                      hover:scale-105
                      disabled:cursor-not-allowed
                      disabled:opacity-35
                    "
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>

                <p className="mt-1.5 text-center text-[7px] text-slate-400 dark:text-slate-600">
                  Zia provides project guidance · not official cadastral decisions
                </p>
              </form>
            </section>
          ) : (
            /* ==============================================================
               COMPACT LAUNCHER
            ============================================================== */

            <div className="flex flex-col items-center">
              <div className="relative">
                <span
                  className="
                    zia-pulse
                    pointer-events-none
                    absolute
                    inset-0
                    rounded-full
                    bg-blue-500/25
                  "
                />

                <button
                  type="button"
                  onClick={() =>
                    setIsOpen(true)
                  }
                  aria-label="Open Zia AI Assistant"
                  className="
                    group
                    relative
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    overflow-hidden
                    rounded-full
                    border
                    border-white/80
                    bg-gradient-to-br
                    from-blue-950
                    via-blue-800
                    to-indigo-900
                    shadow-[0_12px_35px_rgba(30,64,175,.30)]
                    transition-all
                    duration-300
                    hover:-translate-y-1
                    hover:scale-105
                    dark:border-slate-600
                  "
                >
                  <img
                    src={robotLogo}
                    alt="Zia"
                    className="
                      zia-float
                      h-full
                      w-full
                      object-cover
                    "
                  />

                  <span
                    className="
                      absolute
                      bottom-0.5
                      right-0.5
                      h-3
                      w-3
                      rounded-full
                      border-2
                      border-blue-900
                      bg-emerald-400
                    "
                  />
                </button>
              </div>

              <div
                className="
                  mt-1.5
                  rounded-full
                  border
                  border-white/70
                  bg-white/75
                  px-2.5
                  py-1
                  text-center
                  text-[8px]
                  font-semibold
                  text-slate-600
                  shadow-sm
                  backdrop-blur-xl
                  dark:border-slate-700
                  dark:bg-slate-900/75
                  dark:text-slate-300
                "
              >
                <span className="text-blue-600 dark:text-blue-400">
                  Zia
                </span>
                <span className="mx-1 text-slate-300 dark:text-slate-600">
                  ·
                </span>
                Here to help you
              </div>
            </div>
          )}
        </div>
      </>
    );
  };

export default GuidedAssistant;