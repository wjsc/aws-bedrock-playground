const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");
const { loadSharedConfigFiles } = require('@aws-sdk/shared-ini-file-loader');
const { fromSSO } = require("@aws-sdk/credential-providers");

const REGION = "xxxxx"

const getRoleNameFromLocalFolder = async () => {
    try {
        const { configFile: { platform: { sso_role_name } } } = await loadSharedConfigFiles({ profile: "platform" });
        return sso_role_name;
    } catch (error) {
        console.error('Error al obtener el nombre del rol desde la carpeta local:', error);
        throw error;
    }
};

const getLocalCredentials = async (ssoRegion) => {
    try {
        const ssoRoleName = await getRoleNameFromLocalFolder();
        return await fromSSO({
            ssoStartUrl: "https://xxxx.awsapps.com/start/",
            ssoRegion,
            ssoRoleName,
            ssoAccountId: 00000
        })();
    } catch (error) {
        console.error('Error al obtener las credenciales locales', error);
        throw error;
    }
};


const ask = async (prompt) => {
    
    const client = new BedrockRuntimeClient({ credentials: getLocalCredentials(REGION), region: REGION });
    const modelId = "anthropic.claude-3-sonnet-20240229-v1:0"; 
    
    const params = {
        modelId,
        body: JSON.stringify({
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: 512,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ]
                }
            ],
            temperature: 0.5,
            top_p: 0.9
        }),
        contentType: "application/json",
        accept: "application/json",
    };
    
    try {
        const command = new InvokeModelCommand(params);
        const response = await client.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        console.log("prompt: ", prompt)
        console.log("response: ", responseBody?.content?.[0]?.text);
    } catch (error) {
        console.error("Error invoking model:", error);
    }
}


ask("Como es el clima en buenos aires")
