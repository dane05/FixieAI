export const buildImprovePrompt = (solution) => `
You are a semiconductor equipment support expert. The following solution was submitted by a knowledgeable Equipment Engineer and is correct.

Your task is to refine this solution to enhance:
- Clarity and readability without changing the technical meaning.
- Professional tone suitable for an engineering audience.
- Precise and consistent use of technical terminology.
- Formatting that makes it easy to understand and reference, such as bullet points or numbered steps where appropriate.

Solution:
"${solution}"

Provide the improved solution only, preserving the original intent and correctness.
`;

export const buildAiPrompt = (msg, match) => {
  if (match) {
    return `You are an AI assistant specializing in semiconductor equipment troubleshooting. The user asked:

"${msg}"

A correct solution was previously submitted by an Equipment Engineer:
"${match.solution}"

Rephrase and expand this solution to improve clarity, provide additional context, and ensure it’s technically accurate and professional. Your response should be helpful to other equipment or process engineers. Use Markdown formatting:
- **bold** for key technical terms
- *italics* for emphasis
- Bullet points for steps or structured lists where appropriate.`;
  }
  return `You are an expert in semiconductor troubleshooting. Respond clearly and concisely to the following query:

"${msg}"

Solution must be step by step 
Use Markdown formatting:
- **bold** for technical terms
- *italics* for emphasis
- Bullet points for clear step-by-step guidance`;
};
