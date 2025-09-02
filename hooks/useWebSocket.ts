"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { io, type Socket } from "socket.io-client"
import { tokenManager, type Auction, type Lot, type Offer } from "@/lib/api"

export interface WebSocketContextType {
  socket: Socket | null
  isConnected: boolean
  auctions: Auction[]
  currentAuction: Auction | null
  lots: Lot[]
  onlineUsers: string[]
  joinAuction: (auctionId: string) => void
  createAuction: (auctionData: CreateAuctionData) => void
  createLot: (lotData: CreateLotData) => void
  createOffer: (lotId: string, percent: number, volume: number) => void
  closeAuction: (auctionId: string, offerId: string) => void
  getAuctionLots: (auctionId: string) => void
  getOnlineUsers: (auctionId: string) => void
  cancelOffer: (offerId: string) => void
  closeLot: (lotId: string, auctionId: string) => void
}

export interface CreateAuctionData {
  type: "sell" | "buy"
  asset: string
  // volume: number // Удалено по запросу
  currency: string
  end_time: string
  closing_type: "auto" | "manual" // Добавлено
}

export interface CreateLotData {
  auction_id: string
  asset: string
  volume: string
  percent: string
  lotTermMonth: number // добавлено поле lotTermMonth в интерфейс
}

export function useWebSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [currentAuction, setCurrentAuction] = useState<Auction | null>(null)
  const [lots, setLots] = useState<Lot[]>([])
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const socketRef = useRef<Socket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const currentAuctionIdRef = useRef<string | null>(null)
  const auctionsRef = useRef<Auction[]>([])
  const userRoleRef = useRef<string | null>(null)

  // Обновляем ref при изменении auctions
  useEffect(() => {
    auctionsRef.current = auctions
  }, [auctions])

  // Обновляем ref роли пользователя
  useEffect(() => {
    const token = tokenManager.getToken()
    if (token) {
      const payload = tokenManager.decodeToken(token)
      userRoleRef.current = payload?.role || null
    }
  }, [])

  const isTokenValid = useCallback((token: string): boolean => {
    try {
      const payload = tokenManager.decodeToken(token)
      if (!payload || !payload.exp) {
        console.log("Token payload is invalid")
        return false
      }

      const currentTime = Date.now() / 1000
      const isValid = payload.exp > currentTime

      if (!isValid) {
        console.log("Token expired:", new Date(payload.exp * 1000))
        tokenManager.removeToken()
      } else {
        console.log("Token is valid, expires:", new Date(payload.exp * 1000))
      }

      return isValid
    } catch (error) {
      console.error("Error validating token:", error)
      return false
    }
  }, [])

  const handleSocketEvents = useCallback((socket: Socket) => {
    // Connection events
    socket.on("connect", () => {
      console.log("Socket.IO connected:", socket.id)
      setIsConnected(true)

      // Clear any reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }

      // Request auctions after connection
      socket.emit("auction:all")
    })

    socket.on("connect_error", (error) => {
      console.error("Socket.IO connection error:", error)
      setIsConnected(false)

      // If authentication error, remove token
      if (
        error.message &&
        (error.message.includes("аутентификации") ||
          error.message.includes("authentication") ||
          error.message.includes("unauthorized"))
      ) {
        console.log("Authentication error, removing token")
        tokenManager.removeToken()
        window.dispatchEvent(new CustomEvent("auth-changed"))
      }
    })

    socket.on("disconnect", (reason) => {
      console.log("Socket.IO disconnected:", reason)
      setIsConnected(false)

      // Clear current auction data on disconnect
      setCurrentAuction(null)
      setLots([])
      setOnlineUsers([])
      currentAuctionIdRef.current = null
    })

    // Auction events
    socket.on("auction:all", (data: Auction[]) => {
      console.log("✅ Received auction:all event with data:", data)
      setAuctions(data || [])
    })

    socket.on("auction:created", (data: Auction) => {
      console.log("✅ Received auction:created event with data:", data)
      setAuctions((prev) => [...prev, data])
    })

    socket.on("auction:joined", (user_id: string) => {
      console.log("✅ Received auction:joined event with user_id:", user_id)
      console.log("🔍 This means someone joined the auction (admin notification)")

      const userRole = userRoleRef.current
      console.log("🔍 Current user role:", userRole)

      if (userRole === "admin" || userRole === "initiator") {
        console.log("👑 Admin/Initiator received join notification for user:", user_id)
      }
    })

    socket.on("auction:join_success", (data: { auction_id: string; user_id: string }) => {
      console.log("✅ Successfully joined auction:", data)

      const auctionId = data.auction_id
      currentAuctionIdRef.current = auctionId

      const auctionData = auctionsRef.current.find((auction) => auction.id === auctionId)
      if (auctionData) {
        console.log("📋 Found auction data:", auctionData)
        setCurrentAuction(auctionData)
      }

      console.log("🔄 Auto-requesting lots after successful join...")
      setTimeout(() => {
        console.log("📦 Sending auction:get_lots...")
        socket.emit("auction:get_lots", auctionId)
      }, 1000)
    })

    // Lot events - auction:set_lots приходит от сервера с полными данными лотов
    socket.on("auction:set_lots", (data: Lot[]) => {
      console.log("✅ Received auction:set_lots event from server (full lot data)")
      console.log("📦 Raw data received:", data)
      console.log("📦 Data type:", typeof data)
      console.log("📦 Is array:", Array.isArray(data))
      console.log("📦 Number of lots received:", data?.length || 0)

      setLots(data || [])
      console.log("🔄 Lots state updated, new count:", (data || []).length)
    })

    socket.on("lot:created", (data: Lot) => {
      console.log("✅ Received lot:created event with data:", data)
      console.log("📦 Adding new lot to existing lots")

      setLots((prev) => {
        const newLots = [...prev, data]
        console.log("🔄 Lots state updated via lot:created, new count:", newLots.length)
        return newLots
      })
    })

    // Offer events (теперь привязаны к лотам)
    socket.on("lot:set_offers", (data: Offer[]) => {
      console.log("✅ Received lot:set_offers event with data:", data)
      console.log("📊 Number of offers received:", data?.length || 0)

      // Обновляем offers внутри соответствующего лота в lots state
      if (data && data.length > 0) {
        const lotId = data[0].lot_id
        setLots((prevLots) => prevLots.map((lot) => (lot.id === lotId ? { ...lot, offers: data } : lot)))
      }
    })

    socket.on("offer:created", (data: Offer) => {
      console.log("✅ Received offer:new event with data:", data)
      console.log("Offer ID:", data.id, "Lot ID:", data.lot_id)
      console.log("Raw data.volume on receipt:", typeof data.volume, data.volume)
      console.log("Raw data.percent on receipt:", typeof data.percent, data.percent)
      console.log("Raw data.created_at on receipt:", typeof data.created_at, data.created_at)

      setLots((prevLots) => {
        console.log("Prev Lots state in offer:new handler:", prevLots)
        const updatedLots = prevLots.map((lot) => {
          if (lot.id === data.lot_id) {
            console.log(`Found matching lot ${lot.id} for new offer.`)
            // Ensure volume is a number, handling potential string input
            const parsedVolume = typeof data.volume === "string" ? Number.parseFloat(data.volume) : Number(data.volume)
            const finalVolume = isNaN(parsedVolume) ? 0 : parsedVolume

            // Ensure percent is a number, handling potential string input
            const parsedPercent =
              typeof data.percent === "string" ? Number.parseFloat(data.percent) : Number(data.percent)
            const finalPercent = isNaN(parsedPercent) ? 0 : parsedPercent

            // Ensure created_at is a valid date string, or use current time as fallback
            const dateObj = new Date(data.created_at)
            const finalCreatedAt = isNaN(dateObj.getTime()) ? new Date().toISOString() : data.created_at

            const newOffer: Offer = {
              ...data,
              volume: finalVolume,
              percent: finalPercent,
              created_at: finalCreatedAt,
            }

            const currentOffers = lot.offers || []

            // Check if the offer already exists to prevent duplicates or handle updates
            const existingOfferIndex = currentOffers.findIndex((o) => o.id === newOffer.id)

            let offersToSet
            if (existingOfferIndex > -1) {
              // Update existing offer
              offersToSet = [...currentOffers]
              offersToSet[existingOfferIndex] = newOffer
              console.log(`Offer ${newOffer.id} updated in lot ${lot.id}.`)
            } else {
              // Add new offer
              offersToSet = [...currentOffers, newOffer]
              console.log(`Adding new offer ${newOffer.id} to lot ${lot.id}.`)
            }
            console.log("Offers for this lot after update:", offersToSet)
            return { ...lot, offers: offersToSet }
          }
          return lot
        })
        console.log("Updated Lots state after offer:new handler:", updatedLots)
        const updatedLot = updatedLots.find((l) => l.id === data.lot_id)
        console.log("Offers for the specific updated lot:", updatedLot?.offers)
        return updatedLots
      })
    })

    socket.on("offer:canceled", (data: { offer_id: string; lot_id: string }) => {
      console.log("[v0] ✅ Received offer:canceled event from server")
      console.log("[v0] Canceled offer ID:", data.offer_id)
      console.log("[v0] Lot ID:", data.lot_id)
      console.log("[v0] Processing offer removal from lots state...")

      setLots((prevLots) => {
        console.log("[v0] Current lots count before removal:", prevLots.length)

        const updatedLots = prevLots.map((lot) => {
          if (lot.id === data.lot_id) {
            const beforeCount = (lot.offers || []).length
            const updatedOffers = (lot.offers || []).filter((offer) => offer.id !== data.offer_id)
            const afterCount = updatedOffers.length

            console.log("[v0] Found target lot:", lot.id)
            console.log("[v0] Offers before removal:", beforeCount)
            console.log("[v0] Offers after removal:", afterCount)
            console.log("[v0] Successfully removed offer:", data.offer_id)

            return { ...lot, offers: updatedOffers }
          }
          return lot
        })

        console.log("[v0] Lots state updated after offer cancellation")
        return updatedLots
      })
    })

    // Добавляем обработчик события закрытия лота
    socket.on("lot:closed", (data: { lot_id: string; auction_id: string }) => {
      console.log("[v0] ✅ Received lot:closed event from server")
      console.log("[v0] Closed lot ID:", data.lot_id)
      console.log("[v0] Auction ID:", data.auction_id)
      console.log("[v0] Processing lot closure in lots state...")

      setLots((prevLots) => {
        console.log("[v0] Current lots count before closure:", prevLots.length)

        const updatedLots = prevLots.map((lot) => {
          if (lot.id === data.lot_id) {
            console.log("[v0] Found target lot to close:", lot.id)
            console.log("[v0] Lot status before closure:", lot.status)

            const closedLot = { ...lot, status: "closed" as const }
            console.log("[v0] Lot status after closure:", closedLot.status)

            return closedLot
          }
          return lot
        })

        console.log("[v0] Lots state updated after lot closure")
        return updatedLots
      })
    })

    // Other events
    socket.on("auction:closed", (data: Auction) => {
      console.log("✅ Received auction:closed event with data:", data)
      setAuctions((prev) => prev.map((auction) => (auction.id === data.id ? data : auction)))
      setCurrentAuction((prev) => {
        if (prev && prev.id === data.id) {
          return data
        }
        return prev
      })
    })

    socket.on("auction:online_users", (data: string[]) => {
      console.log("✅ Received auction:online_users event with data:", data)
      setOnlineUsers(data || [])
    })

    socket.on("auction:error", (error: any) => {
      console.error("❌ Received auction:error event:", error)
    })

    socket.on("lot:error", (error: any) => {
      console.error("❌ Received lot:error event:", error)
    })

    socket.on("auction:user_left", (data: any) => {
      console.log("👋 Received auction:user_left event:", data)
    })

    // Добавим обработчик для всех событий (debug)
    socket.onAny((eventName, ...args) => {
      console.log(`🔔 Received event: ${eventName}`, args)
    })

    // Добавим обработчик для исходящих событий (debug)
    socket.onAnyOutgoing((eventName, ...args) => {
      console.log(`📤 Sending event: ${eventName}`, args)
    })
  }, [])

  const connect = useCallback(() => {
    const token = tokenManager.getToken()

    if (!token) {
      console.log("No token available for Socket.IO connection")
      return
    }

    if (!isTokenValid(token)) {
      console.log("Token is invalid or expired")
      return
    }

    // Prevent multiple connections
    if (socketRef.current?.connected) {
      console.log("Socket already connected")
      return
    }

    // Disconnect existing socket
    if (socketRef.current) {
      console.log("Disconnecting existing socket")
      socketRef.current.disconnect()
    }

    const SOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "https://mfa.kse.kg:8443"

    console.log("[v0] ===== WebSocket Connection Debug =====")
    console.log("[v0] Environment variable NEXT_PUBLIC_WEBSOCKET_URL:", process.env.NEXT_PUBLIC_WEBSOCKET_URL)
    console.log("[v0] Environment variable NEXT_PUBLIC_API_BASE_URL:", process.env.NEXT_PUBLIC_API_BASE_URL)
    console.log("[v0] Fallback WebSocket URL:", "https://mfa.kse.kg:8443")
    console.log("[v0] Final SOCKET_URL:", SOCKET_URL)
    console.log("[v0] WebSocket will connect to:", SOCKET_URL)
    console.log(
      "[v0] Connection protocol:",
      SOCKET_URL.startsWith("https") ? "WSS (Secure WebSocket)" : "WS (WebSocket)",
    )
    console.log("[v0] ========================================")

    console.log("Connecting to Socket.IO server:", SOCKET_URL)

    const newSocket = io(SOCKET_URL, {
      auth: {
        token: token,
      },
      // Try polling first, then websocket as fallback
      transports: ["polling", "websocket"],
      timeout: 20000, // Increased timeout
      reconnection: true,
      reconnectionAttempts: 5, // More attempts
      reconnectionDelay: 3000, // Longer delay between attempts
      reconnectionDelayMax: 10000,
      // Force new connection
      forceNew: true,
      // Additional options for better compatibility
      upgrade: true,
      rememberUpgrade: false,
    })

    newSocket.on("connect", () => {
      console.log("[v0] ✅ WebSocket successfully connected!")
      console.log("[v0] Socket ID:", newSocket.id)
      console.log("[v0] Connected to URL:", SOCKET_URL)
      console.log("[v0] Transport used:", newSocket.io.engine.transport.name)
      console.log("[v0] Connection successful after transport:", newSocket.io.engine.transport.name)
    })

    newSocket.on("connect_error", (error) => {
      console.error("[v0] ❌ WebSocket connection error:")
      console.error("[v0] Error message:", error.message)
      console.error("[v0] Error type:", error.type)
      console.error("[v0] Error description:", error.description)
      console.error("[v0] Error context:", error.context)
      console.error("[v0] Attempted URL:", SOCKET_URL)
      console.error("[v0] Available transports:", newSocket.io.opts.transports)
      console.error("[v0] Current transport attempt:", newSocket.io.engine?.transport?.name || "none")
      console.error("[v0] Full error object:", error)

      // Check for specific error types
      if (error.message.includes("websocket error")) {
        console.error("[v0] 🔍 WebSocket transport failed - this could be due to:")
        console.error("[v0] - Server not supporting WebSocket protocol")
        console.error("[v0] - SSL certificate issues")
        console.error("[v0] - Firewall blocking WebSocket connections")
        console.error("[v0] - CORS policy restrictions")
        console.error("[v0] 💡 Trying polling transport as fallback...")
      }

      if (error.message.includes("timeout")) {
        console.error("[v0] 🔍 Connection timeout - server may be unreachable")
        console.error("[v0] 💡 Check if server is running at:", SOCKET_URL)
      }
    })

    newSocket.on("disconnect", (reason, details) => {
      console.log("[v0] 🔌 WebSocket disconnected:")
      console.log("[v0] Reason:", reason)
      console.log("[v0] Details:", details)

      if (reason === "transport error") {
        console.error("[v0] 🔍 Transport error occurred - connection lost")
      }
    })

    newSocket.io.on("error", (error) => {
      console.error("[v0] 🚨 Socket.IO engine error:", error)
    })

    newSocket.io.engine.on("upgrade", () => {
      console.log("[v0] 🔄 Transport upgraded to:", newSocket.io.engine.transport.name)
    })

    newSocket.io.engine.on("upgradeError", (error) => {
      console.error("[v0] ❌ Transport upgrade failed:", error)
    })

    socketRef.current = newSocket
    setSocket(newSocket)

    // Set up event handlers
    handleSocketEvents(newSocket)

    return newSocket
  }, [handleSocketEvents, isTokenValid])

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log("Disconnecting Socket.IO")
      socketRef.current.disconnect()
      socketRef.current = null
      setSocket(null)
      setIsConnected(false)
      setAuctions([])
      setCurrentAuction(null)

      console.log("🧹 Clearing lots state on disconnect")
      setLots([])
      setOnlineUsers([])
      currentAuctionIdRef.current = null
    }

    // Clear reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }, [])

  // Socket actions
  const joinAuction = useCallback(
    (auctionId: string) => {
      if (socket && isConnected) {
        console.log("📤 Sending auction:join for auction:", auctionId)
        console.log("🔍 User role:", userRoleRef.current)

        currentAuctionIdRef.current = auctionId
        console.log("💾 Stored auction ID in ref:", auctionId)

        socket.emit("auction:join", auctionId)

        console.log("📦 Requesting lots after join attempt (for all roles)...")
        setTimeout(() => {
          console.log("📦 Sending auction:get_lots (unconditional)...")
          socket.emit("auction:get_lots", auctionId)
        }, 2000)
      } else {
        console.warn("❌ Socket not connected, cannot join auction")
      }
    },
    [socket, isConnected],
  )

  const createAuction = useCallback(
    (auctionData: CreateAuctionData) => {
      if (socket && isConnected) {
        console.log("📤 Sending auction:create with data:", auctionData)
        socket.emit("auction:create", auctionData)
      } else {
        console.warn("❌ Socket not connected, cannot create auction")
      }
    },
    [socket, isConnected],
  )

  const createLot = useCallback(
    (lotData: CreateLotData) => {
      if (socket && isConnected) {
        console.log("📤 Sending lot:create with data:", lotData)
        socket.emit("lot:create", lotData)
      } else {
        console.warn("❌ Socket not connected, cannot create lot")
      }
    },
    [socket, isConnected],
  )

  const createOffer = useCallback(
    (lotId: string, percent: number, volume: number) => {
      if (socket && isConnected) {
        const offerData = {
          lot_id: lotId,
          percent,
          volume,
        }
        console.log("📤 Sending offer:create with data:", offerData)
        socket.emit("offer:create", offerData)
      } else {
        console.warn("❌ Socket not connected, cannot create offer")
      }
    },
    [socket, isConnected],
  )

  const closeAuction = useCallback(
    (auctionId: string, offerId: string) => {
      if (socket && isConnected) {
        // Изменено: теперь отправляем только auctionId как строку
        console.log("📤 Sending auction:close for auction ID:", auctionId)
        socket.emit("auction:close", auctionId)
      } else {
        console.warn("❌ Socket not connected, cannot close auction")
      }
    },
    [socket, isConnected],
  )

  const getAuctionLots = useCallback(
    (auctionId: string) => {
      if (socket && isConnected) {
        console.log("📤 Sending auction:get_lots to server for auction:", auctionId)
        console.log("🔍 User role:", userRoleRef.current)
        console.log("🔍 Current lots in state before request:", lots.length)
        console.log("🔍 Socket connected:", socket.connected)
        console.log("🔍 Socket ID:", socket.id)
        console.log("🔍 Expecting to receive auction:set_lots event from server with full lot data including offers")

        socket.emit("auction:get_lots", auctionId)

        setTimeout(() => {
          console.log("⏰ 5 seconds after auction:get_lots request")
          console.log("🔍 Current lots count:", lots.length)
          console.log("🔍 Did we receive auction:set_lots event?")
        }, 5000)
      } else {
        console.warn("❌ Socket not connected, cannot get lots")
        console.log("🔍 Socket exists:", !!socket)
        console.log("🔍 Is connected:", isConnected)
        console.log("🔍 Socket connected state:", socket?.connected)
      }
    },
    [socket, isConnected, lots.length],
  )

  const getOnlineUsers = useCallback(
    (auctionId: string) => {
      if (socket && isConnected) {
        console.log("📤 Sending auction:get_online_users for auction:", auctionId)
        socket.emit("auction:get_online_users", auctionId)
      } else {
        console.warn("❌ Socket not connected, cannot get online users")
      }
    },
    [socket, isConnected],
  )

  const cancelOffer = useCallback(
    (offerId: string) => {
      if (socket && isConnected) {
        console.log("[v0] Starting offer cancellation process")
        console.log("[v0] Offer ID to cancel:", offerId)
        console.log("[v0] Socket connected:", socket.connected)
        console.log("[v0] Socket ID:", socket.id)
        console.log("[v0] Current user role:", userRoleRef.current)
        console.log("[v0] Sending offer:cancel event to server...")

        socket.emit("offer:cancel", offerId)

        console.log("[v0] offer:cancel event sent successfully")
        console.log("[v0] Waiting for offer:canceled response from server...")
      } else {
        console.warn("[v0] ❌ Cannot cancel offer - socket not connected")
        console.log("[v0] Socket exists:", !!socket)
        console.log("[v0] Is connected:", isConnected)
        console.log("[v0] Socket connected state:", socket?.connected)
      }
    },
    [socket, isConnected],
  )

  // Добавляем функцию закрытия лота
  const closeLot = useCallback(
    (lotId: string, auctionId: string) => {
      if (socket && isConnected) {
        console.log("[v0] Starting lot closure process")
        console.log("[v0] Lot ID to close:", lotId)
        console.log("[v0] Auction ID:", auctionId)
        console.log("[v0] Socket connected:", socket.connected)
        console.log("[v0] Socket ID:", socket.id)
        console.log("[v0] Current user role:", userRoleRef.current)
        console.log("[v0] Sending lot:close event to server...")

        const closeData = {
          lot_id: lotId,
          auction_id: auctionId,
        }

        socket.emit("lot:close", closeData)

        console.log("[v0] lot:close event sent successfully with data:", closeData)
        console.log("[v0] Waiting for lot:closed response from server...")
      } else {
        console.warn("[v0] ❌ Cannot close lot - socket not connected")
        console.log("[v0] Socket exists:", !!socket)
        console.log("[v0] Is connected:", isConnected)
        console.log("[v0] Socket connected state:", socket?.connected)
      }
    },
    [socket, isConnected],
  )

  // Connect when component mounts and token is available
  useEffect(() => {
    const token = tokenManager.getToken()
    if (token && isTokenValid(token)) {
      connect()
    } else if (token && !isTokenValid(token)) {
      console.log("Token exists but is invalid, removing...")
      tokenManager.removeToken()
    }

    // Listen for auth changes
    const handleAuthChange = () => {
      const newToken = tokenManager.getToken()
      if (newToken && isTokenValid(newToken) && !socketRef.current?.connected) {
        console.log("Auth changed, connecting...")
        // Add delay to prevent rapid reconnections
        reconnectTimeoutRef.current = setTimeout(() => connect(), 1000)
      } else if (!newToken && socketRef.current) {
        console.log("Auth removed, disconnecting...")
        disconnect()
      }
    }

    window.addEventListener("auth-changed", handleAuthChange)

    return () => {
      window.removeEventListener("auth-changed", handleAuthChange)
      disconnect()
    }
  }, [connect, disconnect, isTokenValid])

  return {
    socket,
    isConnected,
    auctions,
    currentAuction,
    lots,
    onlineUsers,
    joinAuction,
    createAuction,
    createLot,
    createOffer,
    closeAuction,
    getAuctionLots,
    getOnlineUsers,
    cancelOffer,
    // Добавляем функцию в возвращаемый объект
    closeLot,
  }
}
