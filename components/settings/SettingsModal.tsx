"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTheme } from "next-themes"
import { User, Settings, Database, Moon, Sun, Monitor, Trash2, Bot, Save } from "lucide-react"
import { toast } from "react-toastify"
import { modelConfigs } from "@/backend/services/models.config"

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: any
}

export function SettingsModal({ open, onOpenChange, user }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState("profile")
  const { setTheme, theme } = useTheme()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    defaultModel: "Llama 4 Scout (17B)",
    themePreference: "system",
    autoScroll: true
  })

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        defaultModel: user.defaultModel || "Llama 4 Scout (17B)",
        themePreference: user.themePreference || "system",
        autoScroll: user.autoScroll !== false
      })
    }
  }, [user])

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Settings saved successfully")
        if (formData.themePreference) {
          setTheme(formData.themePreference)
        }
        onOpenChange(false)
        // Optionally refresh page or mutate global state here
        window.location.reload();
      } else {
        toast.error(data.error || "Failed to save settings")
      }
    } catch (err) {
      toast.error("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleClearChats = async () => {
    if (!confirm("Are you sure you want to delete all your chats? This cannot be undone.")) return;
    setLoading(true)
    try {
      // Assuming a DELETE /api/chats route exists or we loop and delete
      toast.success("Chat history cleared (UI only for now)")
    } catch (err) {
      toast.error("Failed to clear chats")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden h-[600px] flex flex-col md:flex-row">
        
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 bg-muted/30 border-r p-4 flex flex-col gap-2 overflow-y-auto">
          <h2 className="font-semibold px-2 mb-2">Settings</h2>
          
          <Button 
            variant={activeTab === "profile" ? "secondary" : "ghost"} 
            className="justify-start" 
            onClick={() => setActiveTab("profile")}
          >
            <User className="mr-2 h-4 w-4" /> Profile
          </Button>
          
          <Button 
            variant={activeTab === "general" ? "secondary" : "ghost"} 
            className="justify-start" 
            onClick={() => setActiveTab("general")}
          >
            <Settings className="mr-2 h-4 w-4" /> General
          </Button>

          <Button 
            variant={activeTab === "ai" ? "secondary" : "ghost"} 
            className="justify-start" 
            onClick={() => setActiveTab("ai")}
          >
            <Bot className="mr-2 h-4 w-4" /> AI Models
          </Button>
          
          <Button 
            variant={activeTab === "data" ? "secondary" : "ghost"} 
            className="justify-start text-destructive hover:bg-destructive/10 hover:text-destructive" 
            onClick={() => setActiveTab("data")}
          >
            <Database className="mr-2 h-4 w-4" /> Data Controls
          </Button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto relative">
          
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">Profile</h3>
                <p className="text-sm text-muted-foreground">Manage your personal information.</p>
              </div>
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email (Read Only)</Label>
                  <Input value={user?.email || ""} disabled className="bg-muted/50" />
                </div>
              </div>
            </div>
          )}

          {activeTab === "general" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">General</h3>
                <p className="text-sm text-muted-foreground">Customize the appearance and behavior.</p>
              </div>
              
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select 
                    value={formData.themePreference} 
                    onValueChange={v => setFormData({...formData, themePreference: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light"><div className="flex items-center"><Sun className="mr-2 h-4 w-4"/> Light</div></SelectItem>
                      <SelectItem value="dark"><div className="flex items-center"><Moon className="mr-2 h-4 w-4"/> Dark</div></SelectItem>
                      <SelectItem value="system"><div className="flex items-center"><Monitor className="mr-2 h-4 w-4"/> System</div></SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 pt-4">
                  <Label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                      checked={formData.autoScroll}
                      onChange={e => setFormData({...formData, autoScroll: e.target.checked})}
                    />
                    <span>Auto-scroll to bottom of chat</span>
                  </Label>
                  <p className="text-xs text-muted-foreground ml-6">Automatically scrolls the chat feed as new messages are typed.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "ai" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">AI Settings</h3>
                <p className="text-sm text-muted-foreground">Configure your default AI experiences.</p>
              </div>
              
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label>Default Chat Model</Label>
                  <Select 
                    value={formData.defaultModel} 
                    onValueChange={v => setFormData({...formData, defaultModel: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Model" />
                    </SelectTrigger>
                    <SelectContent>
                      {modelConfigs.map((m) => (
                         <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">This model will be selected by default when creating new chats.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "data" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-destructive">Data Controls</h3>
                <p className="text-sm text-muted-foreground">Manage your chat history and account data.</p>
              </div>
              
              <div className="space-y-4 p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                <div>
                  <h4 className="font-medium">Clear Chat History</h4>
                  <p className="text-sm text-muted-foreground mb-4">Permanently delete all your chat sessions and messages.</p>
                  <Button variant="destructive" onClick={handleClearChats} disabled={loading}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete All Chats
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Save Button (Sticky bottom) */}
          {activeTab !== "data" && (
            <div className="absolute bottom-6 right-6">
              <Button onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
