// გიოს ბრძანებების პარსერი — საკვანძო-სიტყვებზე დაფუძნებული, სრულად ოფლაინ.
// ეტაპი 3-ში (SMS) და ეტაპი 4-ში (კალენდარი) აქ დაემატება ნამდვილი ლოგიკა.

const GREETINGS = ['გამარჯობა', 'სალამი', 'ჰეი', 'გაუმარჯოს']

/**
 * იღებს მომხმარებლის ტექსტს (ხმით ან აკრეფით) და აბრუნებს პასუხს + intent ტიპს.
 * @param {string} text
 * @returns {{ reply: string, intent: string }}
 */
export function handleCommand(text) {
  const t = text.trim().toLowerCase()

  if (!t) {
    return { reply: 'არ გავიგონე, სცადე თავიდან.', intent: 'empty' }
  }

  if (GREETINGS.some((g) => t.includes(g))) {
    return { reply: 'გამარჯობა! რით შემიძლია დაგეხმარო?', intent: 'greeting' }
  }

  if (t.includes('შეტყობინებ') || t.includes('sms') || t.includes('ესემეს')) {
    return {
      reply: 'SMS ფუნქცია მალე დაემატება — მომდევნო ეტაპზე ვაშენებთ.',
      intent: 'sms_stub',
    }
  }

  if (t.includes('შემახსენ') || t.includes('კალენდარ') || t.includes('დავალებ') || t.includes('ჩანიშვნ')) {
    return {
      reply: 'კალენდრის ფუნქცია მალე დაემატება — ეტაპი 4-ზე ავაშენებთ.',
      intent: 'calendar_stub',
    }
  }

  if (t.includes('რა დროა') || t.includes('საათი')) {
    const now = new Date()
    const time = now.toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })
    return { reply: `ახლა არის ${time}.`, intent: 'time' }
  }

  return {
    reply: 'ეს ბრძანება ჯერ არ ვიცი, მაგრამ ვსწავლობ.',
    intent: 'unknown',
  }
}
