import { useRef, useState, useEffect, useMemo } from "react";
import Message from "@/components/Message";
import Menu from "@/components/Menu";
import { Message as MessageType } from "@/types/chat";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import Image from "next/image";
import ReactMarkdown from "react-markdown";

import Chat from "@/components/Chat";
import Question from "@/components/Question";
import Answer from "@/components/Answer";

type MainProps = {};

const Main = ({}: MainProps) => {
  const [message, setMessage] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [messageState, setMessageState] = useState<{
    messages: MessageType[];
    pending?: string;
    history: [string, string][];
  }>({
    messages: [
      {
        message: "Hi there its Thien! What would like to learn about me?",
        type: "apiMessage",
      },
    ],
    history: [],
  });

  const { messages, pending, history } = messageState;

  const messageListRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textAreaRef.current?.focus();
  }, []);

  //handle form submission
  async function handleSubmit(e: any) {
    e.preventDefault();

    if (!query) {
      alert("Please input a question");
      return;
    }

    const question = query.trim();

    setMessageState((state) => ({
      ...state,
      messages: [
        ...state.messages,
        {
          type: "userMessage",
          message: question,
        },
      ],
      pending: undefined,
    }));

    setLoading(true);
    setQuery("");
    setMessageState((state) => ({ ...state, pending: "" }));

    const ctrl = new AbortController();

    try {
      fetchEventSource("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          history,
        }),
        signal: ctrl.signal,
        onmessage: (event) => {
          if (event.data === "[DONE]") {
            setMessageState((state) => ({
              history: [...state.history, [question, state.pending ?? ""]],
              messages: [
                ...state.messages,
                {
                  type: "apiMessage",
                  message: state.pending ?? "",
                },
              ],
              pending: undefined,
            }));
            setLoading(false);
            ctrl.abort();
          } else {
            const data = JSON.parse(event.data);
            setMessageState((state) => ({
              ...state,
              pending: (state.pending ?? "") + data.data,
            }));
          }
        },
      });
    } catch (error) {
      setLoading(false);
      console.log("error", error);
    }
  }

  //prevent empty submissions
  const handleEnter = (e: any) => {
    if (e.key === "Enter" && query) {
      handleSubmit(e);
    } else if (e.key == "Enter") {
      e.preventDefault();
    }
  };

  const chatMessages = useMemo(() => {
    return [
      ...messages,
      ...(pending ? [{ type: "apiMessage", message: pending }] : []),
    ];
  }, [messages, pending]);

  return (
    <>
      <Chat title="ThienGPT">
        {chatMessages.map((message, index) => {
          if (message.type === "apiMessage") {
            return <Answer key={index}>{message.message}</Answer>;
          } else {
            return (
              <Question key={index} content={message.message} time="Just now" />
            );
          }
        })}
        {loading ? <Answer loading /> : null}
      </Chat>
      {/* <Menu className="max-w-[30.75rem] mx-auto" items={navigation} /> */}
      <Message
        ref={textAreaRef}
        onEnter={handleEnter}
        onSubmit={handleSubmit}
        disabled={loading}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        // onChange={(e: any) => setMessage(e.target.value)}
      />
    </>
  );
};

export default Main;
