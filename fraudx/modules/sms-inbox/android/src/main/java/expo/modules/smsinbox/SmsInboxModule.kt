package expo.modules.smsinbox

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.database.ContentObserver
import android.os.Handler
import android.os.Looper
import android.provider.Telephony
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class SmsPermissionException : CodedException("READ_SMS permission has not been granted")

/**
 * Read-only bridge to the device SMS inbox.
 *
 * - getMessages(limit, sinceMs) returns the newest inbox messages received after sinceMs.
 * - "onInboxChange" fires whenever the SMS provider changes (e.g. a new message arrives),
 *   so JS can pull the delta and score it immediately.
 */
class SmsInboxModule : Module() {
  private var observer: ContentObserver? = null

  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("SmsInbox")

    Events("onInboxChange")

    Function("hasPermission") {
      hasReadPermission()
    }

    AsyncFunction("getMessages") { limit: Int, sinceMs: Double ->
      if (!hasReadPermission()) throw SmsPermissionException()
      readInbox(limit, sinceMs.toLong())
    }

    OnStartObserving {
      registerObserver()
    }

    OnStopObserving {
      unregisterObserver()
    }

    OnDestroy {
      unregisterObserver()
    }
  }

  private fun hasReadPermission(): Boolean =
    context.checkSelfPermission(Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED

  private fun readInbox(limit: Int, sinceMs: Long): List<Map<String, Any?>> {
    val projection = arrayOf(
      Telephony.Sms._ID,
      Telephony.Sms.ADDRESS,
      Telephony.Sms.BODY,
      Telephony.Sms.DATE
    )
    val results = mutableListOf<Map<String, Any?>>()
    context.contentResolver.query(
      Telephony.Sms.Inbox.CONTENT_URI,
      projection,
      "${Telephony.Sms.DATE} > ?",
      arrayOf(sinceMs.toString()),
      "${Telephony.Sms.DATE} DESC"
    )?.use { cursor ->
      val idIdx = cursor.getColumnIndexOrThrow(Telephony.Sms._ID)
      val addressIdx = cursor.getColumnIndexOrThrow(Telephony.Sms.ADDRESS)
      val bodyIdx = cursor.getColumnIndexOrThrow(Telephony.Sms.BODY)
      val dateIdx = cursor.getColumnIndexOrThrow(Telephony.Sms.DATE)
      while (cursor.moveToNext() && results.size < limit) {
        results.add(
          mapOf(
            "id" to cursor.getString(idIdx),
            "sender" to (cursor.getString(addressIdx) ?: "Unknown"),
            "body" to (cursor.getString(bodyIdx) ?: ""),
            "receivedAt" to cursor.getLong(dateIdx).toDouble()
          )
        )
      }
    }
    return results
  }

  private fun registerObserver() {
    if (observer != null) return
    val obs = object : ContentObserver(Handler(Looper.getMainLooper())) {
      override fun onChange(selfChange: Boolean) {
        sendEvent("onInboxChange", emptyMap<String, Any>())
      }
    }
    context.contentResolver.registerContentObserver(Telephony.Sms.CONTENT_URI, true, obs)
    observer = obs
  }

  private fun unregisterObserver() {
    observer?.let { appContext.reactContext?.contentResolver?.unregisterContentObserver(it) }
    observer = null
  }
}
