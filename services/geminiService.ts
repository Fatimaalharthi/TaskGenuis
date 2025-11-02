

import { GoogleGenAI, Type } from "@google/genai";
import { Task, TaskStatus, TaskPriority, Subtask, Project } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateTasksFromFileContent(
  content: string,
  members: string[]
): Promise<{ tasks: Task[], projectName: string }> {
  const prompt = `
    Based on the following project document, identify the project title and list the tasks that need to be completed. 
    For each task, provide a concise title, a detailed description, a suggested assignee, an estimated due date, and a priority.
    Also, for each main task, break it down into a few smaller, actionable subtasks.
    The project document content is:
    ---
    ${content}
    ---
    The available team members are: ${members.join(', ')}. Assign tasks only to these members.
    The priority should be one of: Low, Medium, High.
    Format the output as a single JSON object with two keys: "projectName" (a string for the project title) and "tasks" (an array of task objects).
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      projectName: {
        type: Type.STRING,
        description: "The title of the project extracted from the document."
      },
      tasks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "A short, descriptive title for the task.",
            },
            description: {
              type: Type.STRING,
              description: "A detailed description of what needs to be done for the task.",
            },
            assignee: {
              type: Type.STRING,
              description: `The name of the team member assigned to this task. Must be one of: ${members.join(', ')}.`,
            },
            dueDate: {
              type: Type.STRING,
              description: "The estimated due date for the task in YYYY-MM-DD format.",
            },
            priority: {
              type: Type.STRING,
              description: "The priority of the task. Must be one of: Low, Medium, High."
            },
            subtasks: {
              type: Type.ARRAY,
              description: "A list of smaller, actionable subtasks.",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: {
                    type: Type.STRING,
                    description: "The title of the subtask."
                  }
                },
                required: ["title"]
              }
            }
          },
          required: ["title", "description", "assignee", "dueDate", "priority", "subtasks"],
        },
      }
    },
    required: ["projectName", "tasks"],
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text.trim();
    const parsedResponse = JSON.parse(jsonText);

    if (!parsedResponse || typeof parsedResponse !== 'object' || !Array.isArray(parsedResponse.tasks) || typeof parsedResponse.projectName !== 'string') {
        throw new Error("API did not return a valid object with projectName and tasks array.");
    }
    
    const tasks = parsedResponse.tasks.map((task: any): Task => ({
      ...task,
      id: `task-${Date.now()}-${Math.random()}`,
      status: TaskStatus.ToDo,
      priority: task.priority || TaskPriority.Medium,
      subtasks: task.subtasks?.map((subtask: any): Subtask => ({
        id: `subtask-${Date.now()}-${Math.random()}`,
        title: subtask.title,
        completed: false,
      })) || [],
      creationDate: new Date().toISOString(),
    }));

    return {
        tasks,
        projectName: parsedResponse.projectName
    };
  } catch (error) {
    console.error("Error generating tasks:", error);
    throw error; // Re-throw original error for UI to handle
  }
}

export async function suggestFocusTasks(
  tasks: Task[],
  sessionDuration: number
): Promise<string[]> {
  if (tasks.length === 0) {
    return [];
  }

  const prompt = `
    You are a productivity coach AI. Your task is to select a small, focused list of tasks for a user's deep work session.
    Analyze the provided list of tasks and select 1 to 3 tasks that are the most critical and can be realistically progressed within the given session duration.

    Consider these factors for selection:
    1.  **Priority:** 'High' priority tasks should be favored.
    2.  **Due Date:** Tasks with closer due dates are more urgent. Today is ${new Date().toISOString().split('T')[0]}.
    3.  **Status:** Prioritize 'To Do' or 'In Progress' tasks. Avoid 'Done' tasks.
    4.  **Impact:** Choose tasks that seem most impactful based on their title and description.
    5.  **Manageability:** Don't suggest too many tasks for the time slot. One major task or a few smaller ones is ideal.

    The user's available tasks are:
    ---
    ${JSON.stringify(tasks.map(t => ({ id: t.id, title: t.title, priority: t.priority, dueDate: t.dueDate, status: t.status, description: t.description })))}
    ---
    The user wants to focus for **${sessionDuration} minutes**.

    Return a JSON array containing only the string IDs of the suggested tasks. For example: ["task-123", "task-456"].
  `;

  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.STRING,
      description: "The ID of a suggested task."
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });
    
    const jsonText = response.text.trim();
    const taskIds = JSON.parse(jsonText);

    if (Array.isArray(taskIds) && taskIds.every(id => typeof id === 'string')) {
      return taskIds;
    }
    return [];
  } catch (error) {
    console.error("Error suggesting focus tasks:", error);
    throw error; // Re-throw original error for UI to handle
  }
}


interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

export async function getContextualChatbotResponseStream(
  projectBrief: string,
  tasks: Task[],
  chatHistory: ChatMessage[],
  newMessage: string
) {
  const projectContext = `
    **Project Brief:**
    ${projectBrief || 'No project brief has been uploaded yet.'}

    **Current Tasks JSON Data:**
    ${tasks.length > 0 ? JSON.stringify(tasks, null, 2) : 'No tasks have been generated yet.'}
  `;
  
  const contents = [
      ...chatHistory,
      { role: 'user' as const, parts: [{ text: newMessage }] }
  ];

  const response = await ai.models.generateContentStream({
    model: "gemini-2.5-flash",
    contents: contents,
    config: {
        systemInstruction: `You are a helpful project management assistant named Gemini Pilot. 
        You have access to the current project's data, including a project brief and a list of tasks in JSON format.
        Use this data to answer user questions accurately and specifically. 
        When asked about tasks, refer to details like title, assignee, dueDate, status, and priority from the JSON data.
        If the user asks a general project management question, you can answer that too.
        If a question is ambiguous, ask for clarification.
        If the answer is not in the provided data, state that you don't have that information.
        Keep your responses concise, friendly, and formatted in clear Markdown.
        
        Here is the project context you MUST use for your answers:
        ---
        ${projectContext}
        ---
        `,
    }
  });

  return response;
}

export async function generateProjectBrief(
  project: Project,
  tasks: Task[]
): Promise<string> {
  if (tasks.length === 0) {
    return "This project doesn't have any tasks yet. Once tasks are added, I can provide a more detailed summary.";
  }

  const prompt = `
    You are a project management AI assistant.
    Based on the provided project name and its list of tasks, generate a concise and informative project brief.
    The brief should summarize the project's current state, highlighting key areas of focus.
    Format the output in clear Markdown. Include headings like "## Overall Status", "## Key Statistics", and "## Next Steps".

    Project Name: ${project.name}

    Current tasks:
    ---
    ${JSON.stringify(tasks.map(t => ({ title: t.title, status: t.status, priority: t.priority, dueDate: t.dueDate })))}
    ---
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    
    return response.text;
  } catch (error) {
    console.error("Error generating project brief:", error);
    if (error instanceof Error && (error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('429'))) {
        return "The AI is currently busy and cannot generate a brief. Please try again in a moment.";
    }
    return "I was unable to generate a brief for this project at the moment. Please try again later.";
  }
}