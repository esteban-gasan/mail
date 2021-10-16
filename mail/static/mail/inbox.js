document.addEventListener("DOMContentLoaded", function () {
  // Use buttons to toggle between views
  document
    .querySelector("#inbox")
    .addEventListener("click", () => loadMailbox("inbox", true));
  document
    .querySelector("#sent")
    .addEventListener("click", () => loadMailbox("sent", true));
  document
    .querySelector("#archived")
    .addEventListener("click", () => loadMailbox("archive", true));
  document.querySelector("#compose").addEventListener("click", () => {
    // Add a new element to the browsing history
    history.pushState({ mailbox: "compose" }, "", `#compose`);
    composeEmail();
  });
  document.querySelector("#compose-form").onsubmit = sendEmail;

  // By default, load the inbox
  loadMailbox("inbox", true);
});

// Load the previous page when user goes back in history
window.onpopstate = (e) => {
  if ("emailId" in e.state) {
    openEmail(e.state.emailId);
  } else {
    e.state.mailbox === "compose"
      ? composeEmail()
      : loadMailbox(e.state.mailbox);
  }
};

function displayView(view) {
  // Hide all the views, then only display the requested view
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#single-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "none";

  if (view) document.querySelector(`#${view}-view`).style.display = "block";
}

function composeEmail(replyTo) {
  const recipients = document.querySelector("#compose-recipients");
  const subject = document.querySelector("#compose-subject");
  const body = document.querySelector("#compose-body");

  if (!replyTo) {
    // Clear out composition fields
    recipients.value = "";
    subject.value = "";
    body.value = "";
  } else {
    // Populate the form with the email details
    const re = "Re: ";
    recipients.value = replyTo.sender;
    subject.value = `${replyTo.subject.startsWith(re) ? "" : re}${
      replyTo.subject
    }`;
    body.value = `On ${replyTo.timestamp} ${replyTo.sender} wrote:\n"${replyTo.body}"\n\n`;
  }

  // Show compose view and hide other views
  displayView("compose");
}

function loadMailbox(mailbox, push = false) {
  // Add a new element to the browsing history
  if (push) history.pushState({ mailbox: mailbox }, "", `#${mailbox}`);
  displayView(); // Hide all the views

  // Change the mailbox name
  document.querySelector("#mailbox-name").innerHTML = `${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }`;
  const emailsTable = document.querySelector("#emails-table");
  emailsTable.innerHTML = "";

  fetch(`/emails/${mailbox}`)
    .then((response) => response.json())
    .then((data) => {
      data.forEach((email) => {
        // Dynamically create a row for each email
        const row = emailsTable.insertRow();
        row.insertCell().append(`${email.sender}`);
        row.insertCell().append(`${email.subject}`);
        row.insertCell().append(`${email.timestamp}`);

        // Add class for gray background if email is read
        row.className = `email-box${email.read ? " table-secondary" : ""}`;
        row.dataset.id = `${email.id}`; // Used to fetch the email
        row.addEventListener("click", (e) => {
          // Add a new element to the browsing history
          // Calling the pushState here, instead of inside the function
          // prevents a new element from being pushed to history
          history.pushState(
            { mailbox: mailbox, emailId: email.id },
            "",
            `#${mailbox}/${email.id}`
          );
          openEmail(email.id);
          // If using dataset: openEmail(e.currentTarget.dataset.id)
        });

        if (mailbox !== "sent") {
          const archiveBtn = document.createElement("button");
          const buttonCell = row.insertCell();
          buttonCell.className = "btn-cell";
          buttonCell.append(archiveBtn);
          archiveBtn.className = "btn btn-sm btn-outline-success";
          archiveBtn.type = "button";
          archiveBtn.innerHTML = `${
            mailbox === "inbox" ? "Archive" : "Unarchive"
          }`;
          archiveBtn.addEventListener("click", (e) => {
            e.stopPropagation(); // Stop event from bubbling up
            changeArchivedStatus(e, email.id, email.archived);
          });
        }
      });
    })
    .then(() => {
      displayView("emails"); // Show the mailbox and hide other views
    });
}

function openEmail(emailId) {
  // Display an email and its details
  const subject = document.querySelector("#email-subject");
  const sender = document.querySelector("#email-sender");
  const recipients = document.querySelector("#email-recipients");
  const timestamp = document.querySelector("#email-timestamp");
  const body = document.querySelector("#email-body");
  const archiveBtn = document.querySelector("#archive-btn");
  subject.innerHTML = "&nbsp;";
  sender.innerHTML = "";
  recipients.innerHTML = "";
  timestamp.innerHTML = "";
  body.innerHTML = "";

  fetch(`/emails/${emailId}`)
    .then((response) => response.json())
    .then((email) => {
      // Update the single view with the email data
      subject.innerHTML = email.subject;
      sender.innerHTML = email.sender;
      recipients.innerHTML = email.recipients.join(", ");
      timestamp.innerHTML = email.timestamp;
      body.innerHTML = email.body;

      // Check if the current user is not the sender
      const userEmail = document.querySelector("#user-email").innerHTML;
      if (userEmail !== email.sender) {
        archiveBtn.innerHTML = `${!email.archived ? "Archive" : "Unarchive"}`;
        archiveBtn.style.display = "block";
        archiveBtn.onclick = (e) => {
          changeArchivedStatus(e, emailId, email.archived);
        };
      } else {
        // Hide the archive button if the user sent the email
        archiveBtn.style.display = "none";
      }

      // Add listener to the reply button
      document.querySelector("#reply-btn").onclick = () => {
        history.pushState({ mailbox: "compose" }, "", `#compose`);
        composeEmail(email);
      };

      if (!email.read) {
        // Modify the read property of this mail on the server
        fetch(`/emails/${emailId}`, {
          method: "PUT",
          body: JSON.stringify({ read: true }),
        });
      }
    })
    .then(() => displayView("single")); // Show the email card
}

function changeArchivedStatus(e, emailId, archived) {
  var element = e.target;
  fetch(`/emails/${emailId}`, {
    method: "PUT",
    body: JSON.stringify({ archived: !archived }),
  }).then(() => {
    if (element.parentElement.tagName === "DIV") {
      // When the button is clicked from the single email view
      loadMailbox("inbox", true);
    } else {
      // Get the parent row and remove it
      element = element.closest(".email-box");
      element.style.animationPlayState = "running"; // Start the hide animation
      element.addEventListener("animationend", () => element.remove());
    }
  });
}

function sendEmail() {
  const emailData = {
    recipients: document.querySelector("#compose-recipients").value,
    subject: document.querySelector("#compose-subject").value,
    body: document.querySelector("#compose-body").value,
  };

  fetch("/emails", {
    method: "POST",
    body: JSON.stringify(emailData),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.error) alert(data.error);
    })
    .then(() => loadMailbox("sent", true))
    .catch((error) => console.log(error));

  // Stop form from submitting
  return false;
}
