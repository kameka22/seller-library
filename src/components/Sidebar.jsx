import { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";

export default function Sidebar({
  activeTab,
  onTabChange,
  updateAvailable,
  onUpdateClick,
}) {
  const { t } = useLanguage();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [objectsExpanded, setObjectsExpanded] = useState(true);
  const [photosExpanded, setPhotosExpanded] = useState(true);
  const [listExpanded, setListExpanded] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    // Function to load user name from localStorage
    const loadUserName = () => {
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      setUserName(userInfo.firstName || "User");
    };

    // Load initially
    loadUserName();

    // Listen for updates
    window.addEventListener("userInfoUpdated", loadUserName);

    // Cleanup
    return () => {
      window.removeEventListener("userInfoUpdated", loadUserName);
    };
  }, []);

  const menuItems = [
    {
      id: "objects",
      label: t("sidebar.objects"),
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      ),
      submenu: [
        { id: "objects-list", label: t("objects.myObjects") },
        { id: "objects-categories", label: t("categories.title") },
      ],
    },
    {
      id: "photos",
      label: t("sidebar.photos"),
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      submenu: [
        { id: "photos-import", label: t("photos.import") },
        { id: "photos-collection", label: t("photos.collection") },
      ],
    },
    {
      id: "platforms",
      label: t("sidebar.platforms"),
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
          />
        </svg>
      ),
      submenu: [
        { id: "platforms-list", label: t("platforms.list") },
        { id: "platforms-sales", label: t("platforms.sales") },
      ],
    },
  ];

  return (
    <div
      className={`bg-gray-900 text-white transition-all duration-300 flex flex-col ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-800">
        {!isCollapsed && <h1 className="text-xl font-bold">Seller Library</h1>}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors ml-auto"
          title={isCollapsed ? "Déplier" : "Replier"}
        >
          <svg
            className={`w-5 h-5 transition-transform ${isCollapsed ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <div key={item.id}>
            <button
              onClick={() => {
                if (item.submenu) {
                  if (item.id === "objects") {
                    setObjectsExpanded(!objectsExpanded);
                  } else if (item.id === "photos") {
                    setPhotosExpanded(!photosExpanded);
                  } else if (item.id === "platforms") {
                    setListExpanded(!listExpanded);
                  }
                } else {
                  onTabChange(item.id);
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id ||
                (item.submenu && activeTab.startsWith(item.id))
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
              title={isCollapsed ? item.label : ""}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!isCollapsed && (
                <>
                  <span className="font-medium flex-1 text-left">
                    {item.label}
                  </span>
                  {item.submenu && (
                    <svg
                      className={`w-4 h-4 transition-transform ${
                        (item.id === "objects" && objectsExpanded) ||
                        (item.id === "photos" && photosExpanded) ||
                        (item.id === "platforms" && listExpanded)
                          ? "rotate-180"
                          : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  )}
                </>
              )}
            </button>

            {/* Submenu */}
            {item.submenu &&
              !isCollapsed &&
              ((item.id === "objects" && objectsExpanded) ||
                (item.id === "photos" && photosExpanded) ||
                (item.id === "platforms" && listExpanded)) && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.submenu.map((subItem) => (
                    <button
                      key={subItem.id}
                      onClick={() => onTabChange(subItem.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${
                        activeTab === subItem.id
                          ? "bg-blue-500 text-white"
                          : "text-gray-400 hover:bg-gray-800 hover:text-white"
                      }`}
                    >
                      {subItem.label}
                    </button>
                  ))}
                </div>
              )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-800">
        {/* Version */}
        {!isCollapsed && (
          <div className="px-4 py-3">
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={onUpdateClick}
                className={`text-xs truncate hover:underline cursor-pointer ${updateAvailable === false ? "text-green-400" : "text-gray-400"}`}
                title={t("update.clickToCheck")}
              >
                {t("common.version")} 0.1.4
              </button>
              {updateAvailable && (
                <button
                  onClick={onUpdateClick}
                  className="flex-shrink-0 w-4 h-4 bg-yellow-500 rounded-sm hover:bg-yellow-600 transition-colors relative group"
                  title={t("update.title")}
                >
                  <svg
                    className="w-3 h-3 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M3 6l3-3v10a2 2 0 104 0V3l3 3m6 3a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* User Block */}
        <button
          onClick={() => onTabChange("user-settings")}
          className={`w-full p-4 border-t border-gray-800 hover:bg-gray-800 transition-colors flex items-center gap-3 ${isCollapsed ? "justify-center" : ""}`}
        >
          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium truncate">{userName}</p>
              <p className="text-xs text-gray-400 truncate">
                {t("user.settings")}
              </p>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
