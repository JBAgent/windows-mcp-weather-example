#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log file for debugging
const logFile = path.join(__dirname, "..", "weather-server.log");

// Helper function for logging (useful for Windows debugging)
function logToFile(message: string): void {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message}\n`;
  
  try {
    fs.appendFileSync(logFile, logMessage, { encoding: "utf8" });
  } catch (error) {
    // Don't throw errors if logging fails
    console.error("Failed to write to log file:", error);
  }
}

// Constants
const NWS_API_BASE = "https://api.weather.gov";
const USER_AGENT = "weather-app/1.0";

// Helper function for making NWS API requests
async function makeNWSRequest<T>(url: string): Promise<T | null> {
  const headers = {
    "User-Agent": USER_AGENT,
    Accept: "application/geo+json",
  };

  try {
    logToFile(`Making request to ${url}`);
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      logToFile(`HTTP error! status: ${response.status}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json() as T;
    logToFile(`Request successful`);
    return data;
  } catch (error) {
    logToFile(`Error making NWS request: ${error}`);
    console.error("Error making NWS request:", error);
    return null;
  }
}

// Define interfaces for our data types
interface AlertFeature {
  properties: {
    event?: string;
    areaDesc?: string;
    severity?: string;
    status?: string;
    headline?: string;
  };
}

// Format alert data
function formatAlert(feature: AlertFeature): string {
  const props = feature.properties;
  return [
    `Event: ${props.event || "Unknown"}`,
    `Area: ${props.areaDesc || "Unknown"}`,
    `Severity: ${props.severity || "Unknown"}`,
    `Status: ${props.status || "Unknown"}`,
    `Headline: ${props.headline || "No headline"}`,
    "---",
  ].join("\n");
}

interface ForecastPeriod {
  name?: string;
  temperature?: number;
  temperatureUnit?: string;
  windSpeed?: string;
  windDirection?: string;
  shortForecast?: string;
}

interface AlertsResponse {
  features: AlertFeature[];
}

interface PointsResponse {
  properties: {
    forecast?: string;
  };
}

interface ForecastResponse {
  properties: {
    periods: ForecastPeriod[];
  };
}

// Create server instance with error handling for Windows
try {
  logToFile("Initializing MCP server");
  
  const server = new McpServer({
    name: "weather",
    version: "1.0.0",
  });

  // Register weather tools
  server.tool(
    "get-alerts",
    "Get weather alerts for a state",
    {
      state: z.string().length(2).describe("Two-letter state code (e.g. CA, NY)"),
    },
    async ({ state }) => {
      logToFile(`Get alerts tool called with state: ${state}`);
      const stateCode = state.toUpperCase();
      const alertsUrl = `${NWS_API_BASE}/alerts?area=${stateCode}`;
      const alertsData = await makeNWSRequest<AlertsResponse>(alertsUrl);

      if (!alertsData) {
        return {
          content: [
            {
              type: "text",
              text: "Failed to retrieve alerts data",
            },
          ],
        };
      }

      const features = alertsData.features || [];
      if (features.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No active alerts for ${stateCode}`,
            },
          ],
        };
      }

      const formattedAlerts = features.map(formatAlert);
      const alertsText = `Active alerts for ${stateCode}:\n\n${formattedAlerts.join("\n")}`;

      return {
        content: [
          {
            type: "text",
            text: alertsText,
          },
        ],
      };
    },
  );

  server.tool(
    "get-forecast",
    "Get weather forecast for a location",
    {
      latitude: z.number().min(-90).max(90).describe("Latitude of the location"),
      longitude: z
        .number()
        .min(-180)
        .max(180)
        .describe("Longitude of the location"),
    },
    async ({ latitude, longitude }) => {
      logToFile(`Get forecast tool called with lat: ${latitude}, lon: ${longitude}`);
      
      // Get grid point data
      const pointsUrl = `${NWS_API_BASE}/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`;
      const pointsData = await makeNWSRequest<PointsResponse>(pointsUrl);

      if (!pointsData) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to retrieve grid point data for coordinates: ${latitude}, ${longitude}. This location may not be supported by the NWS API (only US locations are supported).`,
            },
          ],
        };
      }

      const forecastUrl = pointsData.properties?.forecast;
      if (!forecastUrl) {
        return {
          content: [
            {
              type: "text",
              text: "Failed to get forecast URL from grid point data",
            },
          ],
        };
      }

      // Get forecast data
      const forecastData = await makeNWSRequest<ForecastResponse>(forecastUrl);
      if (!forecastData) {
        return {
          content: [
            {
              type: "text",
              text: "Failed to retrieve forecast data",
            },
          ],
        };
      }

      const periods = forecastData.properties?.periods || [];
      if (periods.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No forecast periods available",
            },
          ],
        };
      }

      // Format forecast periods
      const formattedForecast = periods.map((period: ForecastPeriod) =>
        [
          `${period.name || "Unknown"}:`,
          `Temperature: ${period.temperature || "Unknown"}°${period.temperatureUnit || "F"}`,
          `Wind: ${period.windSpeed || "Unknown"} ${period.windDirection || ""}`,
          `${period.shortForecast || "No forecast available"}`,
          "---",
        ].join("\n"),
      );

      const forecastText = `Forecast for ${latitude}, ${longitude}:\n\n${formattedForecast.join("\n")}`;

      return {
        content: [
          {
            type: "text",
            text: forecastText,
          },
        ],
      };
    },
  );

  // Start the server with Windows-specific error handling
  async function main() {
    try {
      logToFile("Creating stdio transport");
      const transport = new StdioServerTransport();
      
      logToFile("Connecting server to transport");
      await server.connect(transport);
      
      logToFile("Weather MCP Server running on stdio");
      console.error("Weather MCP Server running on stdio");
    } catch (error) {
      logToFile(`Fatal error initializing server: ${error}`);
      console.error("Fatal error initializing server:", error);
      process.exit(1);
    }
  }

  main().catch((error) => {
    logToFile(`Fatal error in main(): ${error}`);
    console.error("Fatal error in main():", error);
    process.exit(1);
  });

} catch (error) {
  logToFile(`Fatal error during setup: ${error}`);
  console.error("Fatal error during setup:", error);
  process.exit(1);
}
