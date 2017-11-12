$(function(){
    
    $.ajax({
        type: 'GET',
        url: '/bills/get',
        success: function(bills){
            console.log(bills);
            $.each(bills,function(element){
                var monyear = moment(element.Datum).format('MMM YYYY');
                $('#navbarNavAltMarkup').removeClass('show');
                $('#myBills').append('<tr><td>'+monyear+'</td><td>'+element.Gastumsatz.toFixed(2).replace('.',',')+' €'+'</td><td>'+element.Beitrag.toFixed(2).replace('.',',')+' €'+'</td></tr>');
            });
        }
    });
});