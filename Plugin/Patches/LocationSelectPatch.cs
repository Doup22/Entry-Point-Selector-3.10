using EFT;
using EFT.UI.Matchmaker;
using HarmonyLib;
using SPT.Common.Http;
using SPT.Reflection.Patching;
using SPT.Reflection.Utils;
using System;
using System.Reflection;

namespace EntryPointSelector
{
    public class LocationSelectPatch : ModulePatch
    {
        protected override MethodBase GetTargetMethod()
        {
            // Hook into the public instance method "Show" with parameters (InfoClass, RaidSettings)
            var desiredType = typeof(MatchmakerOfflineRaidScreen);
            var desiredMethod = desiredType.GetMethod("Show", BindingFlags.Public | BindingFlags.Instance, null, new Type[] { typeof(InfoClass), typeof(RaidSettings) }, null);

            if (desiredMethod == null)
            {
                Logger.LogError("Failed to find the Show(InfoClass, RaidSettings) method. Please check the method signature.");
            }
            else
            {
                Logger.LogInfo("Successfully found the Show(InfoClass, RaidSettings) method.");
            }

            return desiredMethod;
        }

        [PatchPrefix]
        public static bool PatchPrefix(InfoClass profileInfo, RaidSettings raidSettings)
        {
            if (raidSettings == null)
            {
                Logger.LogError("raidSettings is null in PatchPrefix.");
                return true;
            }

            Logger.LogInfo($"EntryPointSelector invoked for LocationId: {raidSettings.LocationId}");

            // Create a JSON payload with the selected location ID
            var payload = "{\"locationId\": \"" + raidSettings.LocationId + "\"}";

            // Send the HTTP POST request
            RequestHandler.PostJson("/eps/location", payload);

            return true;
        }
    }
}